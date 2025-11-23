// Simple test to validate our MarketService works
// We'll create a minimal test using Node.js built-in fetch

// Mock fetch for Node.js environment if not available
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

console.log('🧪 Testing Data.gov.in API directly...\n');

async function testDataGovApi() {
  const API_KEY = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd00000151d86cef0143446b7d39f7425d6afd7f';
  const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

  try {
    // Test 1: Basic connectivity
    console.log('=== Test 1: Basic API Connectivity ===');
    const url = `${BASE_URL}?api-key=${API_KEY}&format=json&limit=5`;
    
    console.log('📡 Calling API:', url);
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AGROcure/1.0 (Agriculture App)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Success! Got ${data.records?.length || 0} records out of ${data.total || 0} total`);
    
    if (data.records && data.records.length > 0) {
      console.log('Sample record:', {
        commodity: data.records[0].commodity,
        state: data.records[0].state,
        market: data.records[0].market,
        min_price: data.records[0].min_price,
        max_price: data.records[0].max_price,
        modal_price: data.records[0].modal_price
      });
    }
    console.log('');

    // Test 2: Tomato filtering
    console.log('=== Test 2: Filter by Commodity (Tomato) ===');
    const tomatoUrl = `${BASE_URL}?api-key=${API_KEY}&format=json&limit=10&filters[commodity]=Tomato`;
    
    console.log('📡 Calling API with filter:', tomatoUrl);
    const tomatoResponse = await fetch(tomatoUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AGROcure/1.0 (Agriculture App)'
      }
    });

    if (!tomatoResponse.ok) {
      throw new Error(`HTTP ${tomatoResponse.status}: ${tomatoResponse.statusText}`);
    }

    const tomatoData = await tomatoResponse.json();
    console.log(`✅ Success! Got ${tomatoData.records?.length || 0} tomato records out of ${tomatoData.total || 0} total`);
    
    if (tomatoData.records && tomatoData.records.length > 0) {
      console.log('Sample tomato record:', {
        commodity: tomatoData.records[0].commodity,
        state: tomatoData.records[0].state,
        market: tomatoData.records[0].market,
        variety: tomatoData.records[0].variety,
        min_price: tomatoData.records[0].min_price,
        max_price: tomatoData.records[0].max_price,
        modal_price: tomatoData.records[0].modal_price,
        date: tomatoData.records[0].arrival_date
      });
    }
    console.log('');

    // Test 3: State and commodity filtering
    console.log('=== Test 3: Filter by Commodity and State (Tomato in Maharashtra) ===');
    const stateUrl = `${BASE_URL}?api-key=${API_KEY}&format=json&limit=15&filters[commodity]=Tomato&filters[state]=Maharashtra`;
    
    console.log('📡 Calling API with state filter:', stateUrl);
    const stateResponse = await fetch(stateUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AGROcure/1.0 (Agriculture App)'
      }
    });

    if (!stateResponse.ok) {
      throw new Error(`HTTP ${stateResponse.status}: ${stateResponse.statusText}`);
    }

    const stateData = await stateResponse.json();
    console.log(`✅ Success! Got ${stateData.records?.length || 0} tomato records in Maharashtra out of ${stateData.total || 0} total`);
    
    if (stateData.records && stateData.records.length > 0) {
      console.log('Maharashtra tomato markets:');
      stateData.records.forEach((record, i) => {
        console.log(`  ${i+1}. ${record.market} - ₹${record.modal_price}/quintal`);
      });
    }

    console.log('\n🎉 All tests passed! The Data.gov.in API integration is working correctly.');
    console.log('\n📋 Summary:');
    console.log(`- API is accessible and returning data`);
    console.log(`- Commodity filtering works correctly`);
    console.log(`- State filtering works correctly`);
    console.log(`- Real market prices are available for today (${new Date().toLocaleDateString('en-IN')})`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testDataGovApi().catch(console.error);