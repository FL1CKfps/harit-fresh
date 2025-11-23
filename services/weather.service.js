import * as Location from 'expo-location';

class WeatherService {
  constructor() {
    this.apiKey = '90878297e8d1d8c2d9921a209d86a31b';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.geocodingUrl = 'https://api.openweathermap.org/geo/1.0';

    this.cache = new Map();
    this.cacheTtl = new Map();

    this.ttlCurrent = 10 * 60 * 1000; // 10 min
    this.ttlForecast = 30 * 60 * 1000; // 30 min
    this.ttlLocation = 5 * 60 * 1000; // 5 min

    this.lastLocation = null;
    this.lastLocationAt = 0;

    // Last-resort default: Delhi
    this.delhi = { latitude: 28.6139, longitude: 77.2090, city: 'Delhi', region: 'Delhi', country: 'IN' };
  }

  // Cache helpers
  setCache(key, value, ttlMs) {
    this.cache.set(key, value);
    this.cacheTtl.set(key, Date.now() + ttlMs);
  }
  getCache(key) {
    const exp = this.cacheTtl.get(key);
    if (!exp || Date.now() > exp) {
      this.cache.delete(key);
      this.cacheTtl.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  // Location
  async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async getCurrentLocation(useCache = true) {
    try {
      if (useCache && this.lastLocation && Date.now() - this.lastLocationAt < this.ttlLocation) {
        return this.lastLocation;
      }

      const granted = await this.requestLocationPermission();
      if (!granted) return { ...this.delhi };

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
        maximumAge: 60000,
      });

      const { latitude, longitude } = position.coords || {};
      if (
        typeof latitude !== 'number' || typeof longitude !== 'number' ||
        Number.isNaN(latitude) || Number.isNaN(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180
      ) {
        throw new Error('Invalid GPS coordinates');
      }

      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const city = address?.city || address?.district || address?.subregion || 'Unknown';
      const region = address?.region || address?.administrativeArea || address?.state || '';
      const country = address?.country || 'IN';

      const result = { latitude, longitude, city, region, country };
      this.lastLocation = result;
      this.lastLocationAt = Date.now();
      return result;
    } catch {
      return { ...this.delhi };
    }
  }

  // HTTP
  async fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Current weather
  async getCurrentWeather(lat, lon, useCache = true) {
    if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
      throw new Error('Invalid coordinates: lat/lon must be numbers');
    }

    const key = `current:${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (useCache) {
      const hit = this.getCache(key);
      if (hit) return hit;
    }

    const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    const data = await this.fetchJson(url);

    if (!data || !data.main || !Array.isArray(data.weather) || !data.weather[0]) {
      throw new Error('Malformed weather response');
    }

    const out = {
      location: `${data.name || 'Unknown'}, ${data.sys?.country || ''}`.trim(),
      city: data.name || 'Unknown',
      temperature: Math.round(data.main.temp ?? 25),
      temp: Math.round(data.main.temp ?? 25),
      condition: data.weather[0].main || 'Clear',
      description: data.weather[0].description || 'Clear sky',
      humidity: data.main.humidity ?? 50,
      pressure: data.main.pressure ?? 1013,
      windSpeed: Math.round(((data.wind?.speed ?? 0) * 3.6)),
      windDirection: data.wind?.deg ?? 0,
      visibility: (data.visibility ?? 10000) / 1000,
      uvIndex: 0,
      sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '6:00 AM',
      sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '6:00 PM',
      icon: data.weather[0].icon || '01d',
      timestamp: Date.now(),
      coords: { lat, lon },
    };

    this.setCache(key, out, this.ttlCurrent);
    return out;
  }

  async getCurrentWeatherAuto(useCache = true) {
    const loc = await this.getCurrentLocation(useCache);
    const lat = Number(loc.latitude);
    const lon = Number(loc.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error('Invalid location coordinates');
    }
    const weather = await this.getCurrentWeather(lat, lon, useCache);
    weather.detectedLocation = { city: loc.city, region: loc.region, country: loc.country };
    return weather;
  }

  // Forecast
  async getForecast(lat, lon, useCache = true) {
    if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
      throw new Error('Invalid coordinates: lat/lon must be numbers');
    }

    const key = `forecast:${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (useCache) {
      const hit = this.getCache(key);
      if (hit) return hit;
    }

    const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    const data = await this.fetchJson(url);
    if (!data || !Array.isArray(data.list)) throw new Error('Malformed forecast response');

    const hourly = data.list.slice(0, 8).map((it) => ({
      time: new Date((it.dt || Date.now() / 1000) * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      temp: Math.round(it.main?.temp ?? 25),
      condition: it.weather?.[0]?.main || 'Clear',
      description: it.weather?.[0]?.description || 'Clear sky',
      icon: it.weather?.[0]?.icon || '01d',
      precipitation: Math.round((it.pop ?? 0) * 100),
      humidity: it.main?.humidity ?? 50,
      windSpeed: Math.round(((it.wind?.speed ?? 0) * 3.6)),
    }));

    const daily = [];
    const seen = new Set();
    for (const it of data.list) {
      const d = new Date(it.dt * 1000);
      const keyDay = d.toDateString();
      if (seen.has(keyDay)) continue;

      const dayItems = data.list.filter((x) => new Date(x.dt * 1000).toDateString() === keyDay);
      const temps = dayItems.map((x) => x.main?.temp ?? 25);
      const conditions = dayItems.map((x) => x.weather?.[0] || { main: 'Clear', description: 'Clear sky', icon: '01d' });

      const counts = {};
      for (const c of conditions) counts[c.main] = (counts[c.main] || 0) + 1;
      const common = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b), 'Clear');
      const cond = conditions.find((c) => c.main === common) || conditions[0];

      daily.push({
        day: daily.length === 0 ? 'Today' : daily.length === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        condition: cond.main,
        description: cond.description,
        icon: cond.icon,
        precipitation: Math.round(Math.max(...dayItems.map((x) => (x.pop ?? 0) * 100))),
        humidity: Math.round(dayItems.reduce((s, x) => s + (x.main?.humidity ?? 50), 0) / dayItems.length),
        windSpeed: Math.round((dayItems.reduce((s, x) => s + (x.wind?.speed ?? 0), 0) / dayItems.length) * 3.6),
      });

      seen.add(keyDay);
      if (daily.length >= 7) break;
    }

    const out = { hourly, daily, timestamp: Date.now() };
    this.setCache(key, out, this.ttlForecast);
    return out;
  }

  // City lookup + combined
  async getWeatherByCity(city, useCache = true) {
    if (!city || typeof city !== 'string') throw new Error('City name required');

    const key = `city:${city.toLowerCase()}`;
    if (useCache) {
      const hit = this.getCache(key);
      if (hit) return hit.weather;
    }

    const geoUrl = `${this.geocodingUrl}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.apiKey}`;
    const geo = await this.fetchJson(geoUrl);
    if (!Array.isArray(geo) || geo.length === 0) throw new Error('City not found');

    const { lat, lon } = geo[0];
    const weather = await this.getCurrentWeather(lat, lon, useCache);
    this.setCache(key, { lat, lon, weather }, this.ttlForecast);
    return weather;
  }

  async getCompleteWeatherData(location = null, useCache = true) {
    let lat, lon, city;

    if (location && typeof location === 'object' && 'latitude' in location && 'longitude' in location) {
      lat = Number(location.latitude);
      lon = Number(location.longitude);
      city = location.city || 'Unknown';
    } else if (typeof location === 'string') {
      const byCity = await this.getWeatherByCity(location, useCache);
      lat = byCity.coords.lat;
      lon = byCity.coords.lon;
      city = location;
    } else {
      const loc = await this.getCurrentLocation(useCache);
      lat = Number(loc.latitude);
      lon = Number(loc.longitude);
      city = loc.city;
    }

    const [current, forecast] = await Promise.all([
      this.getCurrentWeather(lat, lon, useCache),
      this.getForecast(lat, lon, useCache),
    ]);

    return { current, forecast, location: { lat, lon, city } };
  }

  // Utilities
  getWeatherIcon(openWeatherIcon) {
    const map = {
      '01d': 'sunny',
      '01n': 'moon',
      '02d': 'partly-sunny',
      '02n': 'cloudy-night',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rainy',
      '09n': 'rainy',
      '10d': 'rainy',
      '10n': 'rainy',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'cloudy',
      '50n': 'cloudy',
    };
    return map[openWeatherIcon] || 'partly-sunny';
  }

  clearCache() {
    this.cache.clear();
    this.cacheTtl.clear();
    this.lastLocation = null;
    this.lastLocationAt = 0;
  }

  getCacheStats() {
    return {
      totalCached: this.cache.size,
      keys: Array.from(this.cache.keys()),
      lastLocationAt: this.lastLocationAt ? new Date(this.lastLocationAt).toISOString() : null,
    };
  }
}

const weatherService = new WeatherService();
export default weatherService;
export { WeatherService };
