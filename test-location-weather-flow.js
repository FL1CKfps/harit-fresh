import WeatherService from './services/weather.service.js';
import AIService from './services/aiService.js';

async function testLocationAndWeatherFlow() {
  console.log('🧪 Testing Location and Weather Detection Flow...\n');
  
  try {
    const weatherService = new WeatherService();
    
    // Test 1: Get current location with proper validation
    console.log('Test 1: Getting current location...');
    const location = await weatherService.getCurrentLocation(false); // Force fresh location
    
    console.log('📍 Location Result:');
    console.log('  City:', location.city);
    console.log('  Region:', location.region);
    console.log('  Country:', location.country);  
    console.log('  Latitude:', location.latitude, typeof location.latitude);
    console.log('  Longitude:', location.longitude, typeof location.longitude);
    console.log('  Valid coordinates:', 
      typeof location.latitude === 'number' && typeof location.longitude === 'number' &&
      !isNaN(location.latitude) && !isNaN(location.longitude)
    );
    
    // Test 2: Get weather with automatic location detection
    console.log('\nTest 2: Getting weather with automatic location...');
    const weather = await weatherService.getCurrentWeatherAuto(false); // Force fresh weather
    
    console.log('🌤️ Weather Result:');
    console.log('  Location:', weather.location);
    console.log('  City:', weather.city);
    console.log('  Temperature:', weather.temp, '°C');
    console.log('  Description:', weather.description);
    console.log('  Humidity:', weather.humidity, '%');
    console.log('  Wind Speed:', weather.windSpeed, 'm/s');
    
    if (weather.detectedLocation) {
      console.log('  Detected Location:', weather.detectedLocation);
    }
    
    // Test 3: Test AI context building with weather
    console.log('\nTest 3: Testing AI context with weather...');
    const aiService = new AIService();
    
    const mockFarmerContext = {
      farmer: {
        name: 'Test Farmer',
        location: weather.city || 'Delhi',
        state: 'Delhi',
        landSize: '5',
        soilType: 'Loamy'
      },
      activeCrops: [
        {
          name: 'Rice',
          variety: 'Basmati',
          area: '2',
          stage: 'Flowering'
        }
      ],
      recentHarvests: [],
      landSections: []
    };
    
    const context = await aiService.buildContext(mockFarmerContext, true);
    console.log('\n📋 AI Context with Weather:');
    console.log('=' .repeat(80));
    console.log(context);
    console.log('=' .repeat(80));
    
    console.log('\n✅ All tests completed successfully!');
    console.log(`📍 Location: ${location.city}, ${location.region}`);
    console.log(`🌤️ Weather: ${weather.temp}°C, ${weather.description}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLocationAndWeatherFlow();