// Test script for the updated MarketService
const MarketService = require('./services/marketService.js');

async function testMarketService() {
  console.log('🧪 Testing MarketService with direct Data.gov.in integration...\n');
  
  const marketService = new MarketService();
  
  try {
    // Test 1: API connectivity
    console.log('=== Test 1: API Connectivity ===');
    const apiTest = await marketService.testAPI();
    console.log('API Test Result:', apiTest);
    console.log('');
    
    if (!apiTest.success) {
      console.log('❌ API test failed, stopping tests');
      return;
    }
    
    // Test 2: Get market prices for Tomato (national level)
    console.log('=== Test 2: Tomato Prices (National) ===');
    const tomatoPrices = await marketService.getMarketPrices('Tomato');
    console.log(`Found ${tomatoPrices.length} tomato price records`);
    if (tomatoPrices.length > 0) {
      console.log('Sample record:', tomatoPrices[0]);
    }
    console.log('');
    
    // Test 3: Get market prices for Tomato in Maharashtra
    console.log('=== Test 3: Tomato Prices (Maharashtra) ===');
    const maharashtraTomatoPrices = await marketService.getMarketPrices('Tomato', 'Maharashtra');
    console.log(`Found ${maharashtraTomatoPrices.length} tomato price records in Maharashtra`);
    if (maharashtraTomatoPrices.length > 0) {
      console.log('Sample record:', maharashtraTomatoPrices[0]);
    }
    console.log('');
    
    // Test 4: Get market prices for Tomato in Mumbai, Maharashtra
    console.log('=== Test 4: Tomato Prices (Mumbai, Maharashtra) ===');
    const mumbaiTomatoPrices = await marketService.getMarketPrices('Tomato', 'Maharashtra', 'Mumbai');
    console.log(`Found ${mumbaiTomatoPrices.length} tomato price records in Mumbai, Maharashtra`);
    if (mumbaiTomatoPrices.length > 0) {
      console.log('Sample record:', mumbaiTomatoPrices[0]);
    }
    console.log('');
    
    // Test 5: Search commodities
    console.log('=== Test 5: Commodity Search ===');
    const searchResults = await marketService.searchCommodities('tom');
    console.log(`Found ${searchResults.length} commodities matching "tom"`);
    console.log('Search results:', searchResults.slice(0, 5));
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testMarketService();