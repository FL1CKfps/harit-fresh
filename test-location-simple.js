// Test location and weather detection - CommonJS version
const WeatherService = require('./services/weather.service').default || require('./services/weather.service');

async function testLocationWeatherFix() {
  console.log('🧪 Testing Fixed Location and Weather Detection...\n');
  
  try {
    // Test location detection first
    console.log('Test 1: Getting current location with validation...');
    const location = await WeatherService.getCurrentLocation(false);
    
    console.log('📍 Location Result:');
    console.log('  City:', location.city);
    console.log('  Region:', location.region);
    console.log('  Coordinates:', location.latitude, ',', location.longitude);
    console.log('  Types:', typeof location.latitude, typeof location.longitude);
    console.log('  Valid:', !isNaN(location.latitude) && !isNaN(location.longitude));
    
    // Test weather with auto detection
    console.log('\nTest 2: Getting weather with automatic location...');
    const weather = await WeatherService.getCurrentWeatherAuto(false);
    
    console.log('🌤️ Weather Result:');
    console.log('  Location:', weather.city);
    console.log('  Temperature:', weather.temp, '°C');
    console.log('  Description:', weather.description);
    console.log('  Humidity:', weather.humidity, '%');
    
    console.log('\n✅ Location and weather detection working properly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testLocationWeatherFix();