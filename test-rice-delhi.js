// Test Rice in Delhi scenario - should show national results when no local data
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

console.log('🧪 Testing Rice in Delhi scenario...\n');

const API_KEY = '579b464db66ec23bdd00000151d86cef0143446b7d39f7425d6afd7f';
const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

async function testRiceInDelhi() {
  try {
    console.log('=== Test 1: Check Rice data in Delhi (Expected: No data) ===');
    const delhiRiceUrl = `${BASE_URL}?api-key=${API_KEY}&format=json&limit=10&filters[commodity]=Rice&filters[state]=Delhi`;
    
    const delhiResponse = await fetch(delhiRiceUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'AGROcure/1.0' }
    });
    const delhiData = await delhiResponse.json();
    
    console.log(`Delhi Rice data: ${delhiData.records?.length || 0} records`);
    console.log(`Total available: ${delhiData.total || 0}`);
    console.log('');

    console.log('=== Test 2: Check National Rice data (Fallback) ===');
    const nationalRiceUrl = `${BASE_URL}?api-key=${API_KEY}&format=json&limit=20&filters[commodity]=Rice`;
    
    const nationalResponse = await fetch(nationalRiceUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'AGROcure/1.0' }
    });
    const nationalData = await nationalResponse.json();
    
    console.log(`National Rice data: ${nationalData.records?.length || 0} records`);
    console.log(`Total available: ${nationalData.total || 0}`);
    
    if (nationalData.records && nationalData.records.length > 0) {
      console.log('\nAvailable Rice markets:');
      const stateGroups = {};
      nationalData.records.forEach(record => {
        if (!stateGroups[record.state]) {
          stateGroups[record.state] = [];
        }
        stateGroups[record.state].push(record);
      });

      Object.entries(stateGroups).forEach(([state, records]) => {
        console.log(`  ${state}: ${records.length} markets`);
        records.slice(0, 3).forEach(record => {
          console.log(`    - ${record.market}: ₹${record.modal_price}/quintal`);
        });
        if (records.length > 3) {
          console.log(`    ... and ${records.length - 3} more markets`);
        }
      });
    }
    console.log('');

    console.log('=== Test 3: Frontend Logic Simulation ===');
    
    // Simulate what the frontend should do
    console.log('User searches: Rice, State: Delhi, Market: Delhi');
    console.log('Step 1: Check Delhi specifically...');
    
    if (delhiData.total === 0) {
      console.log('❌ No Rice data in Delhi');
      console.log('Step 2: Fallback to national data...');
      
      if (nationalData.total > 0) {
        console.log('✅ Found national Rice data - should display with location info');
        console.log('Frontend should show: "No data in Delhi - Showing from Karnataka, Uttar Pradesh & more"');
        
        // Show what the user would see
        const sampleRecords = nationalData.records.slice(0, 5);
        console.log('\nUser would see these results:');
        sampleRecords.forEach((record, i) => {
          console.log(`${i + 1}. ${record.market}, ${record.state} - ₹${record.modal_price}/quintal`);
        });
      } else {
        console.log('❌ No Rice data anywhere');
        console.log('Frontend should show: "No Rice prices available nationwide"');
      }
    } else {
      console.log('✅ Found Rice data in Delhi');
    }

    console.log('\n🎯 Expected Frontend Behavior:');
    console.log('1. Show "No data in Delhi - Showing from Karnataka, Uttar Pradesh & more"');
    console.log('2. Display national Rice prices with state/market labels');
    console.log('3. Allow filtering within the results');
    console.log('4. Provide "Search Nationally" button if needed');

    console.log('\n✅ Rice in Delhi test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRiceInDelhi().catch(console.error);