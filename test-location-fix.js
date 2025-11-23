const WeatherService = require('./services/weather.service').WeatherService;

async function testLocationDetection() {
  console.log('🧪 Testing Location Detection and Context...\n');
  
  try {
    const weatherService = new WeatherService();
    
    // Test 1: Get current location
    console.log('Test 1: Getting current location...');
    const location = await weatherService.getCurrentLocation(false); // Don't use cache
    console.log('📍 Location detected:', {
      city: location.city,
      region: location.region,
      country: location.country,
      coordinates: `${location.latitude}, ${location.longitude}`
    });
    
    // Test 2: Get weather for detected location
    console.log('\nTest 2: Getting weather for detected location...');
    const weather = await weatherService.getCurrentWeather();
    console.log('🌤️ Weather data:', {
      city: weather.city,
      description: weather.description,
      temp: weather.temp,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed
    });
    
    console.log('\n🎉 Location detection test completed!');
    console.log(`📍 Your current location is detected as: ${location.city}, ${location.region}`);
    
  } catch (error) {
    console.error('❌ Location test failed:', error.message);
  }
}

testLocationDetection();