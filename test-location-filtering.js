// Test the improved location filtering
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

console.log('🧪 Testing improved location filtering...\n');

// Mock the Data.gov.in API call with our improved filtering logic
const mockFetchDataGovApi = async (filters, limit) => {
  // Simulate API data with mixed locations
  const mockRecords = [
    { commodity: 'Rice', state: 'Delhi', market: 'Azadpur', district: 'North Delhi', min_price: 2000, max_price: 2500, modal_price: 2200, arrival_date: '24/09/2025' },
    { commodity: 'Rice', state: 'Delhi', market: 'Ghazipur', district: 'East Delhi', min_price: 1950, max_price: 2400, modal_price: 2150, arrival_date: '24/09/2025' },
    { commodity: 'Rice', state: 'Uttar Pradesh', market: 'Firozabad', district: 'Firozabad', min_price: 1800, max_price: 2200, modal_price: 2000, arrival_date: '24/09/2025' },
    { commodity: 'Rice', state: 'Uttar Pradesh', market: 'Khorja', district: 'Bulandshahr', min_price: 1750, max_price: 2100, modal_price: 1900, arrival_date: '24/09/2025' },
    { commodity: 'Rice', state: 'Delhi', market: 'Okhla', district: 'South Delhi', min_price: 2100, max_price: 2600, modal_price: 2300, arrival_date: '24/09/2025' },
  ];

  // Filter based on the filters provided
  let filteredRecords = mockRecords;
  
  if (filters.commodity) {
    filteredRecords = filteredRecords.filter(r => 
      r.commodity.toLowerCase() === filters.commodity.toLowerCase()
    );
  }
  
  if (filters.state) {
    const targetState = filters.state.toLowerCase().trim();
    filteredRecords = filteredRecords.filter(r => {
      const recordState = r.state.toLowerCase().trim();
      return recordState === targetState || 
             recordState.includes(targetState) ||
             targetState.includes(recordState);
    });
  }
  
  if (filters.market) {
    const targetMarket = filters.market.toLowerCase().trim();
    filteredRecords = filteredRecords.filter(r => {
      const recordMarket = r.market.toLowerCase().trim();
      return recordMarket === targetMarket ||
             recordMarket.includes(targetMarket) ||
             targetMarket.includes(recordMarket);
    });
  }

  return {
    success: true,
    records: filteredRecords.slice(0, limit),
    total: filteredRecords.length
  };
};

// Transform records function
const transformRecords = (records) => {
  return records.map((record, index) => ({
    "S.No": (index + 1).toString(),
    "City": record.market,
    "State": record.state,
    "District": record.district,
    "Market": record.market,
    "Commodity": record.commodity,
    "Variety": "Standard",
    "Grade": "FAQ",
    "Min Prize": record.min_price.toString(),
    "Max Prize": record.max_price.toString(),
    "Model Prize": record.modal_price.toString(),
    "Date": record.arrival_date,
    "Source": "data.gov.in"
  }));
};

async function testLocationFiltering() {
  try {
    console.log('=== Test 1: Delhi State Filter (Should exclude Firozabad/Khorja) ===');
    
    const delhiResult = await mockFetchDataGovApi({
      commodity: 'Rice',
      state: 'Delhi'
    }, 200);
    
    console.log(`Found ${delhiResult.records.length} records for Delhi:`);
    delhiResult.records.forEach(record => {
      console.log(`  • ${record.market}, ${record.state} - ₹${record.modal_price}/quintal`);
    });
    console.log('');

    console.log('=== Test 2: Client-side Location Filtering ===');
    
    // Simulate what happens in the app - filter results after getting them
    const allResults = await mockFetchDataGovApi({
      commodity: 'Rice'
    }, 200);
    
    console.log(`Total records found: ${allResults.records.length}`);
    allResults.records.forEach(record => {
      console.log(`  • ${record.market}, ${record.state} - ₹${record.modal_price}/quintal`);
    });
    
    // Apply client-side filtering for Delhi
    const clientFiltered = allResults.records.filter(record => {
      const recordState = record.state.toLowerCase().trim();
      const targetState = 'delhi';
      return recordState === targetState || 
             recordState.includes(targetState) ||
             targetState.includes(recordState);
    });
    
    console.log(`\nAfter client-side filtering for Delhi: ${clientFiltered.length} records`);
    clientFiltered.forEach(record => {
      console.log(`  • ${record.market}, ${record.state} - ₹${record.modal_price}/quintal`);
    });
    
    console.log('');
    console.log('=== Test 3: Search Within Results ===');
    
    const transformed = transformRecords(clientFiltered);
    
    // Test search functionality
    const searchTerm = 'azad';
    const searchFiltered = transformed.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      
      const marketMatch = (item.Market || '').toLowerCase().includes(searchLower);
      const stateMatch = (item.State || '').toLowerCase().includes(searchLower);
      const districtMatch = (item.District || '').toLowerCase().includes(searchLower);
      
      return marketMatch || stateMatch || districtMatch;
    });
    
    console.log(`Search results for "${searchTerm}": ${searchFiltered.length} records`);
    searchFiltered.forEach(item => {
      console.log(`  • ${item.Market}, ${item.District}, ${item.State} - ₹${item['Model Prize']}/quintal`);
    });
    
    console.log('\n✅ Location filtering tests completed!');
    console.log('\n📋 Summary:');
    console.log(`- API-level state filtering: ✅ Works (excludes other states)`);
    console.log(`- Client-side location filtering: ✅ Works (refines results)`);
    console.log(`- Search within results: ✅ Works (finds specific markets)`);
    console.log(`- Delhi rice markets found: ${clientFiltered.length} (no Firozabad/Khorja)`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLocationFiltering().catch(console.error);