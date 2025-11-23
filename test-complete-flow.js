// Test the complete flow: Rice in Delhi search
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Simplified MarketService implementation for testing
class TestMarketService {
  constructor() {
    this.dataGovApiKey = process.env.DATA_GOV_API_KEY || '579b464db66ec23bdd00000151d86cef0143446b7d39f7425d6afd7f';
    this.dataGovBaseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
  }

  async fetchDataGovApi(filters = {}, limit = 100) {
    try {
      const params = new URLSearchParams({
        'api-key': this.dataGovApiKey,
        'format': 'json',
        'limit': limit.toString()
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
          params.append(`filters[${key}]`, value.toString().trim());
        }
      });

      const url = `${this.dataGovBaseUrl}?${params.toString()}`;
      console.log(`📡 API Call: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AGROcure/1.0',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Response: ${data?.records?.length || 0}/${data?.total || 0} records`);

        if (data && data.status === 'ok' && Array.isArray(data.records)) {
          return {
            records: data.records,
            total: data.total,
            success: true
          };
        }
      }

      return { records: [], total: 0, success: false };
    } catch (error) {
      console.error('❌ API Error:', error.message);
      return { records: [], total: 0, success: false };
    }
  }

  transformRecords(records) {
    return records.map((record, index) => ({
      "S.No": (index + 1).toString(),
      "City": record.market || 'Unknown',
      "State": record.state || 'Unknown',
      "District": record.district || 'Unknown',
      "Market": record.market || 'Unknown',
      "Commodity": record.commodity || 'Unknown',
      "Variety": record.variety || 'Standard',
      "Grade": record.grade || 'FAQ',
      "Min Prize": record.min_price ? record.min_price.toString() : '0',
      "Max Prize": record.max_price ? record.max_price.toString() : '0',
      "Model Prize": record.modal_price ? record.modal_price.toString() : '0',
      "Date": record.arrival_date || new Date().toLocaleDateString('en-IN'),
      "Source": "data.gov.in"
    }));
  }

  async getMarketPrices(commodity, state, market) {
    console.log(`🔍 Fetching: ${commodity}, ${state || 'any'}, ${market || 'any'}`);

    let marketData = [];
    let queryScope = 'none';

    // Strategy 1: Exact market match
    if (state && market) {
      console.log('🎯 Strategy 1: Exact market match');
      const exactResult = await this.fetchDataGovApi({
        commodity: commodity,
        state: state,
        market: market
      }, 50);

      if (exactResult.success && exactResult.records.length > 0) {
        marketData = this.transformRecords(exactResult.records);
        queryScope = 'exact_market';
        console.log(`✅ Found ${marketData.length} exact matches`);
      } else {
        console.log('⚠️ No exact matches found');
      }
    }

    // Strategy 2: State-level search
    if (marketData.length === 0 && state) {
      console.log('🌍 Strategy 2: State-level search');
      const stateResult = await this.fetchDataGovApi({
        commodity: commodity,
        state: state
      }, 200);

      if (stateResult.success && stateResult.records.length > 0) {
        marketData = this.transformRecords(stateResult.records);
        queryScope = 'state_level';
        console.log(`✅ Found ${marketData.length} state matches`);
      } else {
        console.log('⚠️ No state matches found');
      }
    }

    // Strategy 3: National search
    if (marketData.length === 0) {
      console.log('🌏 Strategy 3: National commodity search');
      const nationalResult = await this.fetchDataGovApi({
        commodity: commodity
      }, 100);

      if (nationalResult.success && nationalResult.records.length > 0) {
        marketData = this.transformRecords(nationalResult.records);
        queryScope = 'national_level';
        console.log(`✅ Found ${marketData.length} national matches`);
      } else {
        console.log('⚠️ No national matches found');
      }
    }

    console.log(`📤 Returning ${marketData.length} records (scope: ${queryScope})`);
    return marketData;
  }
}

async function testCompleteFlow() {
  console.log('🧪 Testing complete Rice in Delhi flow...\n');
  
  const service = new TestMarketService();
  
  try {
    console.log('=== User Action: Search Rice in Delhi ===');
    const results = await service.getMarketPrices('Rice', 'Delhi', 'Delhi');
    
    console.log(`\n📊 Final Results: ${results.length} records`);
    
    if (results.length > 0) {
      console.log('\nFirst 5 results:');
      results.slice(0, 5).forEach((item, i) => {
        console.log(`${i + 1}. ${item.Market}, ${item.State} - ₹${item['Model Prize']}/quintal`);
      });
      
      console.log('\nState distribution:');
      const stateCount = {};
      results.forEach(item => {
        stateCount[item.State] = (stateCount[item.State] || 0) + 1;
      });
      Object.entries(stateCount).forEach(([state, count]) => {
        console.log(`  ${state}: ${count} markets`);
      });
      
      console.log('\n✅ SUCCESS: Frontend should show data with location info');
      console.log('Expected UI: "No data in Delhi - Showing from Karnataka, Uttar Pradesh & more"');
    } else {
      console.log('\n❌ PROBLEM: No data returned - frontend will show "No data available"');
      console.log('This is the bug we need to fix!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow().catch(console.error);