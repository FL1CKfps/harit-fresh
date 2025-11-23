// Import the MarketService class directly - it's exported as default instance
const marketService = require('./services/marketService').default || require('./services/marketService');

async function testAPIFix() {
  console.log('🧪 Testing Fixed CountryStateCity API...\n');
  
  try {
    // Test 1: Fetch States
    console.log('Test 1: Fetching Indian States...');
    const states = await marketService.getStates();
    console.log(`✅ States fetched: ${states.length}`);
    console.log(`📋 First 5 states: ${states.slice(0, 5).join(', ')}\n`);
    
    // Test 2: Fetch Cities for Maharashtra
    console.log('Test 2: Fetching cities for Maharashtra...');
    const maharashtraCities = await marketService.getDistricts('Maharashtra');
    console.log(`✅ Maharashtra cities fetched: ${maharashtraCities.length}`);
    console.log(`📋 First 10 cities: ${maharashtraCities.slice(0, 10).join(', ')}\n`);
    
    // Test 3: Fetch Cities for Delhi
    console.log('Test 3: Fetching cities for Delhi...');
    const delhiCities = await marketService.getDistricts('Delhi');
    console.log(`✅ Delhi cities fetched: ${delhiCities.length}`);
    console.log(`📋 Delhi cities: ${delhiCities.join(', ')}\n`);
    
    // Test 4: Test Rice market data
    console.log('Test 4: Testing Rice market data for Maharashtra...');
    const riceData = await marketService.getMarketPrices('Rice', 'Maharashtra');
    console.log(`✅ Rice data for Maharashtra: ${riceData?.length || 0} records`);
    
    if (riceData && riceData.length > 0) {
      console.log('📋 Sample Rice record:');
      console.log(JSON.stringify(riceData[0], null, 2));
    }
    
    console.log('\n🎉 All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAPIFix();