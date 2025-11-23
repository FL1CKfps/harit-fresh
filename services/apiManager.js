import AsyncStorage from '@react-native-async-storage/async-storage';
import { OPENROUTER_API_KEY } from 'expo-env';

class APIManager {
  constructor() {
    // OpenRouter configuration
    this.openRouterKey = OPENROUTER_API_KEY;
    this.openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.modelName = 'x-ai/grok-4.1-fast';
    
    // Cache configuration
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.defaultCacheTime = 5 * 60 * 1000; // 5 minutes
    this.longCacheTime = 30 * 60 * 1000; // 30 minutes for weather data
    
    // Request throttling
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second between requests
    this.requestQueue = [];
    this.isProcessingQueue = false;
    
    // Error handling
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Cache management
  setCache(key, data, expiryTime = this.defaultCacheTime) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + expiryTime);
  }

  getCache(key) {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Request throttling and queuing
  async throttledRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await this.delay(this.minRequestInterval - timeSinceLastRequest);
      }

      const { requestFn, resolve, reject } = this.requestQueue.shift();
      
      try {
        const result = await requestFn();
        this.lastRequestTime = Date.now();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry mechanism
  async retryRequest(requestFn, retries = this.maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0) {
        await this.delay(this.retryDelay);
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  // Core AI request method using OpenRouter
  async makeAIRequest(prompt, cacheKey = null, cacheTime = this.defaultCacheTime) {
    // Check cache first
    if (cacheKey) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('Returning cached response for:', cacheKey);
        return cached;
      }
    }

    const requestFn = async () => {
      console.log('Making OpenRouter AI request for:', cacheKey || 'uncached');
      console.log('Using model:', this.modelName);
      console.log('Request URL:', this.openRouterUrl);
      
      const requestBody = {
        model: this.modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      // Add timeout to prevent hanging requests
      const fetchPromise = fetch(this.openRouterUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://krishta-app.com',
          'X-Title': 'Krishta AI Agricultural App'
        },
        body: JSON.stringify(requestBody)
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error details:', errorText);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('OpenRouter response data:', JSON.stringify(data, null, 2));
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      return data.choices[0].message.content;
    };

    try {
      const response = await this.throttledRequest(() => this.retryRequest(requestFn));
      
      // Cache the response
      if (cacheKey) {
        this.setCache(cacheKey, response, cacheTime);
      }
      
      return response;
    } catch (error) {
      console.error('OpenRouter AI request failed:', error);
      throw new Error('Unable to get AI response. Please check your connection and try again.');
    }
  }

  // Compatibility method for existing code
  async generateContent(prompt) {
    const response = await this.makeAIRequest(prompt);
    return { text: response };
  }

  // Vision-enabled AI request for image analysis (e.g., soil analysis)
  async makeVisionAIRequest(prompt, imageBase64, cacheKey = null) {
    // Check cache first
    if (cacheKey) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('Returning cached vision response for:', cacheKey);
        return cached;
      }
    }

    const requestFn = async () => {
      console.log('Making OpenRouter Vision AI request for:', cacheKey || 'uncached');
      console.log('Using vision model:', this.modelName);
      
      // Use Sonoma Sky Alpha model for image analysis (supports image inputs)
      const visionModel = this.modelName;
      
      const requestBody = {
        model: visionModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3 // Lower temperature for more consistent soil analysis
      };

      console.log('Vision request body:', JSON.stringify({
        model: requestBody.model,
        messages: [{
          role: requestBody.messages[0].role,
          content: [{
            type: requestBody.messages[0].content[0].type,
            text: requestBody.messages[0].content[0].text
          }, {
            type: requestBody.messages[0].content[1].type,
            image_url: { detail: requestBody.messages[0].content[1].image_url.detail }
          }]
        }],
        max_tokens: requestBody.max_tokens,
        temperature: requestBody.temperature
      }, null, 2));

      // Add timeout to prevent hanging requests
      const fetchPromise = fetch(this.openRouterUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://krishta-app.com',
          'X-Title': 'Krishta AI Agricultural App'
        },
        body: JSON.stringify(requestBody)
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Vision request timed out after 60 seconds')), 60000);
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log('Vision response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter Vision API error details:', errorText);
        throw new Error(`OpenRouter Vision API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('OpenRouter Vision API response:', JSON.stringify(data, null, 2));
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenRouter Vision API');
      }

      const content = data.choices[0].message.content;
      if (!content || content.trim() === '') {
        throw new Error('Empty response from OpenRouter Vision API');
      }

      return content;
    };

    try {
      const response = await this.throttledRequest(() => this.retryRequest(requestFn));
      
      // Cache the response
      if (cacheKey) {
        this.setCache(cacheKey, response, this.defaultCacheTime);
      }
      
      return response;
    } catch (error) {
      console.error('OpenRouter Vision AI request failed:', error);
      throw new Error('Unable to analyze image. Please check your connection and try again.');
    }
  }

  // Specialized API methods

  // Soil Advisory
  async getSoilAdvice(soilType, phLevel, organicMatter, context = '') {
    const cacheKey = `soil_${soilType}_${phLevel}_${organicMatter}`;
    const prompt = `You are Krishta AI, an AI farming assistant. Provide specific fertilizer recommendations in ENGLISH language only for:
    - Soil Type: ${soilType}
    - pH Level: ${phLevel} 
    - Organic Matter: ${organicMatter}
    ${context ? `\nAdditional Context: ${context}` : ''}
    
    Include specific fertilizer types, quantities per acre, application timing, and methods.
    
    Instructions:
    - Use simple, clear English language only
    - DO NOT use any emojis, asterisks (*), hashtags (#), or markdown formatting
    - Use simple bullet points with - or numbers for lists
    - NO symbols or special characters except basic punctuation
    - Be specific to Indian farming conditions
    - Use clear, simple terminology that farmers can understand`;

    const response = await this.makeAIRequest(prompt, cacheKey, this.longCacheTime);
    return this.formatAIResponse(response);
  }

  // Pest Detection and Management
  async analyzePestSymptoms(symptoms, cropType = '', context = '') {
    const cacheKey = `pest_${symptoms.substring(0, 50)}_${cropType}`;
    const prompt = `You are Krishta AI, an AI farming assistant. Analyze these symptoms in ENGLISH language only: "${symptoms}"${cropType ? ` on ${cropType} crop` : ''}.
    ${context ? `\nAdditional Context: ${context}` : ''}
    
    Provide:
    1. Most likely pest/disease (with confidence level)
    2. Immediate treatment recommendations
    3. Prevention strategies
    4. When to seek professional help
    
    Instructions:
    - Use simple, clear English language only
    - DO NOT use asterisks (*), hashtags (#), or markdown formatting
    - Use simple bullet points with - or numbers
    - Be specific and actionable for Indian farmers
    - Use clear, simple terminology that farmers can understand`;

    const response = await this.makeAIRequest(prompt, cacheKey);
    return this.formatAIResponse(response);
  }

  async getPestManagementPlan(pestName, cropType, severity, context = '') {
    const cacheKey = `pest_plan_${pestName}_${cropType}_${severity}`;
    const prompt = `You are Krishta AI, an AI farming assistant. Create a comprehensive management plan in ENGLISH language only for ${pestName} affecting ${cropType} crops (severity: ${severity}).
    ${context ? `\nAdditional Context: ${context}` : ''}
    
    Include:
    1. Immediate action steps
    2. Organic treatment options
    3. Chemical treatments (if necessary)
    4. Monitoring schedule
    5. Prevention for next season
    
    Instructions:
    - Use simple, clear English language only
    - DO NOT use asterisks (*), hashtags (#), or markdown formatting
    - Use simple bullet points with - or numbers
    - Be practical for Indian farming conditions`;

    const response = await this.makeAIRequest(prompt, cacheKey, this.longCacheTime);
    return this.formatAIResponse(response);
  }

  // Weather-based Farming Advice
  async getWeatherBasedAdvice(weatherData, cropTypes = [], context = '') {
    const weatherKey = `${weatherData.condition}_${weatherData.temperature}_${weatherData.humidity}`;
    const cacheKey = `weather_advice_${weatherKey}_${cropTypes.join(',')}`;
    
    const prompt = `You are Krishta AI, an AI farming assistant. Based on current weather conditions, provide advice in ENGLISH language only:
    - Condition: ${weatherData.condition}
    - Temperature: ${weatherData.temperature}°C
    - Humidity: ${weatherData.humidity}%
    - Wind: ${weatherData.windSpeed} km/h
    ${cropTypes.length > 0 ? `- Crops: ${cropTypes.join(', ')}` : ''}
    ${context ? `\nAdditional Context: ${context}` : ''}
    
    Provide specific farming advice for:
    1. Irrigation management
    2. Pest/disease risks
    3. Field activities to prioritize/avoid
    4. Harvest timing considerations
    5. Equipment and storage preparations
    
    Instructions:
    - Use simple, clear English language only
    - DO NOT use asterisks (*), hashtags (#), or markdown formatting
    - Use simple bullet points with - or numbers
    - Be practical for Indian farming conditions`;

    const response = await this.makeAIRequest(prompt, cacheKey, this.longCacheTime);
    return this.formatAIResponse(response);
  }

  // Market and Crop Planning
  async getCropRecommendations(region, season, soilType, farmSize) {
    const cacheKey = `crop_rec_${region}_${season}_${soilType}_${farmSize}`;
    const prompt = `You are Krishta AI, an AI farming assistant. Recommend optimal crops in ENGLISH language only for:
    - Region: ${region}
    - Season: ${season}
    - Soil Type: ${soilType}
    - Farm Size: ${farmSize}
    
    Consider:
    1. Climate suitability
    2. Local agricultural patterns
    3. Water requirements
    4. Investment needed
    5. Crop yield potential
    
    Rank top 5 recommendations with reasoning.
    
    Instructions:
    - Use simple, clear English language only
    - DO NOT use asterisks (*), hashtags (#), or markdown formatting
    - Use simple bullet points with - or numbers
    - Use clear, simple terminology that farmers can understand
    - Be specific to Indian farming conditions`;

    const response = await this.makeAIRequest(prompt, cacheKey, this.longCacheTime);
    return this.formatAIResponse(response);
  }

  async getMarketInsights(cropName, region) {
    const cacheKey = `market_${cropName}_${region}`;
    const prompt = `You are Krishta AI, an AI farming assistant. Provide current market insights in ENGLISH language only for ${cropName} in ${region}:
    
    1. Current price trends
    2. Demand forecast
    3. Best selling strategies
    4. Quality requirements
    5. Timing recommendations for maximum profit
    
    Instructions:
    - Use simple, clear English language only
    - DO NOT use asterisks (*), hashtags (#), or markdown formatting
    - Use simple bullet points with - or numbers
    - Be practical for Indian farmers
    - Include pricing in both rupees and per unit measurements`;

    const response = await this.makeAIRequest(prompt, cacheKey);
    return this.formatAIResponse(response);
  }

  // General Farming Chat
  async getChatResponse(message, context = '') {
    const prompt = `You are Krishta AI, an AI farming assistant for Indian farmers. 
    
    ${context ? `Context: ${context}\n\n` : ''}User question: ${message}
    
    Instructions:
    - Provide helpful, accurate farming advice in ENGLISH language only
    - Be specific and practical for Indian agriculture
    - Use simple, clear language that farmers can understand
    - DO NOT use any emojis, asterisks (*), hashtags (#), or markdown formatting
    - NO symbols or special characters except basic punctuation
    - Use simple bullet points with - or numbers for lists only when necessary
    - Keep responses conversational and friendly
    - Use clear, simple English terminology that farmers can understand
    - Focus on practical solutions farmers can implement`;

    // Don't cache chat responses as they should be conversational
    const response = await this.makeAIRequest(prompt);
    
    // Clean up the response to remove any markdown formatting
    return this.formatAIResponse(response);
  }

  // Helper method to clean and format AI responses
  formatAIResponse(text) {
    if (!text) return text;
    
    return text
      // Remove emojis and symbols
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      // Remove markdown headers (###, ##, #)
      .replace(/#{1,6}\s*/g, '')
      // Remove bold/italic markdown (**text**, *text*) - be more careful with asterisks
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
      // Remove standalone asterisks at beginning of lines
      .replace(/^\s*\*+\s*/gm, '• ')
      // Convert remaining asterisks to bullet points when used as lists
      .replace(/\*\s+/g, '• ')
      // Remove code blocks (```text```)
      .replace(/```[^`]*```/g, '')
      // Remove inline code (`text`)
      .replace(/`([^`]+)`/g, '$1')
      // Remove underscores for emphasis
      .replace(/_([^_]+)_/g, '$1')
      // Clean up bullet points formatting
      .replace(/^\s*[-•]\s*/gm, '• ')
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove trailing whitespace
      .trim();
  }

  // Emergency and Quick Advice
  async getQuickAdvice(issue, urgency = 'normal') {
    const cacheKey = `quick_${issue}_${urgency}`;
    const prompt = `You are Krishta AI, an AI farming assistant. Provide immediate ${urgency === 'urgent' ? 'emergency' : 'quick'} advice in ENGLISH language only for: ${issue}
    
    Format as:
    1. Immediate actions (next 24 hours)
    2. Short-term steps (this week)
    3. Resources/contacts if needed
    
    Instructions:
    - Use simple, clear English language only
    - DO NOT use asterisks (*), hashtags (#), or markdown formatting
    - Use simple bullet points with - or numbers
    - Be specific and actionable for Indian farmers`;

    const response = await this.makeAIRequest(prompt, cacheKey);
    return this.formatAIResponse(response);
  }

  // Weather data integration with real API
  async getCurrentWeather(location) {
    try {
      // Import weather service dynamically to avoid circular dependency
      const _wsMod = require('./weather.service');
      const weatherService = _wsMod && (_wsMod.default || _wsMod);
      
      if (typeof location === 'string') {
        return await weatherService.getWeatherByCity(location);
      } else if (location && location.latitude && location.longitude) {
        return await weatherService.getCurrentWeather(location.latitude, location.longitude);
      } else {
        // Get weather for current location
        const completeWeatherData = await weatherService.getCompleteWeatherData();
        return completeWeatherData.current;
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      
      // Fallback to basic weather data if API fails
      return {
        location: typeof location === 'string' ? location : 'Unknown Location',
        temperature: 25,
        condition: 'Partly Cloudy',
        humidity: 60,
        windSpeed: 10,
        uvIndex: 5,
        pressure: 1013,
        timestamp: Date.now(),
        error: 'Unable to fetch real weather data'
      };
    }
  }

  // Get complete weather data including forecast
  async getCompleteWeatherData(location) {
    try {
      const _wsMod = require('./weather.service');
      const weatherService = _wsMod && (_wsMod.default || _wsMod);
      return await weatherService.getCompleteWeatherData(location);
    } catch (error) {
      console.error('Complete weather data error:', error);
      throw new Error('Unable to fetch weather data. Please check location permissions and connection.');
    }
  }

  // Get weather forecast
  async getWeatherForecast(location) {
    try {
      const _wsMod = require('./weather.service');
      const weatherService = _wsMod && (_wsMod.default || _wsMod);
      
      let lat, lon;
      if (typeof location === 'string') {
        const cityWeather = await weatherService.getWeatherByCity(location);
        lat = cityWeather.coords.lat;
        lon = cityWeather.coords.lon;
      } else if (location && location.latitude && location.longitude) {
        lat = location.latitude;
        lon = location.longitude;
      } else {
        const currentLocation = await weatherService.getCurrentLocation();
        lat = currentLocation.latitude;
        lon = currentLocation.longitude;
      }
      
      return await weatherService.getForecast(lat, lon);
    } catch (error) {
      console.error('Weather forecast error:', error);
      throw error;
    }
  }

  // Analytics and usage tracking
  getCacheStats() {
    return {
      totalCached: this.cache.size,
      cacheHits: Array.from(this.cache.keys()),
      queueLength: this.requestQueue.length
    };
  }

  // Clear expired cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  // Save/load cache to persistent storage
  async saveCacheToDisk() {
    try {
      const cacheData = {
        cache: Array.from(this.cache.entries()),
        expiry: Array.from(this.cacheExpiry.entries())
      };
      await AsyncStorage.setItem('apiCache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to disk:', error);
    }
  }

  async loadCacheFromDisk() {
    try {
      const cacheData = await AsyncStorage.getItem('apiCache');
      if (cacheData) {
        const { cache, expiry } = JSON.parse(cacheData);
        this.cache = new Map(cache);
        this.cacheExpiry = new Map(expiry);
        this.cleanupCache(); // Remove expired entries
      }
    } catch (error) {
      console.warn('Failed to load cache from disk:', error);
    }
  }
}

// Create singleton instance
const apiManager = new APIManager();

// Load cache on startup
apiManager.loadCacheFromDisk();

// Periodically cleanup cache and save to disk
setInterval(() => {
  apiManager.cleanupCache();
  apiManager.saveCacheToDisk();
}, 5 * 60 * 1000); // Every 5 minutes

export default apiManager;