import axios from 'axios';

// Cache for market data
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Data.gov.in API configuration
const DATA_GOV_API_KEY = '579b464db66ec23bdd00000151d86cef0143446b7d39f7425d6afd7f';
const DATA_GOV_BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Clear cache for debugging
    if (req.query.clearCache === 'true') {
      cache.clear();
      console.log('🗑️ Cache cleared');
      return res.status(200).json({ success: true, message: 'Cache cleared' });
    }

    const { commodity, state, market } = req.query;
    if (!commodity) {
      return res.status(400).json({ success: false, error: 'Missing required parameter: commodity' });
    }

    // Check cache
    const cacheKey = `${commodity}_${state || 'all'}_${market || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📋 Returning cached data for', cacheKey);
      return res.status(200).json({ success: true, data: cached.data, cached: true, timestamp: cached.timestamp });
    }

    console.log(`🔍 Fetching market data for commodity: ${commodity}, state: ${state || 'any'}, market: ${market || 'any'}`);

    // Robust Data.gov.in API call function
    const fetchDataGovApi = async (filters = {}, limit = 100) => {
      try {
        // Build query parameters
        const params = new URLSearchParams({
          'api-key': DATA_GOV_API_KEY,
          'format': 'json',
          'limit': limit.toString()
        });

        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value.trim()) {
            params.append(`filters[${key}]`, value.trim());
          }
        });

        const url = `${DATA_GOV_BASE_URL}?${params.toString()}`;
        console.log(`📡 API Call: ${url}`);

        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AgricultureApp/1.0 (Government Data Access)'
          },
          timeout: 30000
        });

        console.log(`📊 API Response: Status ${response.status}, Records: ${response.data?.records?.length || 0}/${response.data?.total || 0}`);

        if (response.data && response.data.status === 'ok' && Array.isArray(response.data.records)) {
          return {
            records: response.data.records,
            total: response.data.total,
            success: true
          };
        } else {
          console.log('⚠️ Invalid API response structure:', response.data);
          return { records: [], total: 0, success: false };
        }
      } catch (error) {
        console.error('❌ Data.gov.in API Error:', error.message);
        console.error('❌ Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        return { records: [], total: 0, success: false, error: error.message };
      }
    };

    // Transform records to expected format
    const transformRecords = (records, source = 'data.gov.in') => {
      return records.map((record, index) => ({
        "S.No": (index + 1).toString(),
        "City": record.market || record.district || 'Unknown',
        "State": record.state || 'Unknown',
        "District": record.district || 'Unknown',
        "Market": record.market || 'Unknown',
        "Commodity": record.commodity || commodity,
        "Variety": record.variety || 'Standard',
        "Grade": record.grade || 'FAQ',
        "Min Prize": record.min_price ? record.min_price.toString() : '0',
        "Max Prize": record.max_price ? record.max_price.toString() : '0',
        "Model Prize": record.modal_price ? record.modal_price.toString() : '0',
        "Date": record.arrival_date || new Date().toLocaleDateString('en-IN'),
        "Source": source
      }));
    };

    let marketData = [];
    let queryScope = 'none';

    // Strategy 1: Exact market match (if both state and market provided)
    if (state && market) {
      console.log('🎯 Strategy 1: Exact market match');
      const exactResult = await fetchDataGovApi({
        commodity: commodity,
        state: state,
        market: market
      }, 50);

      if (exactResult.success && exactResult.records.length > 0) {
        marketData = transformRecords(exactResult.records);
        queryScope = 'exact_market';
        console.log(`✅ Found ${marketData.length} records for exact market match`);
      } else {
        console.log('⚠️ No records found for exact market match');
      }
    }

    // Strategy 2: State-level search (if no exact match or only state provided)
    if (marketData.length === 0 && state) {
      console.log('🌍 Strategy 2: State-level search');
      const stateResult = await fetchDataGovApi({
        commodity: commodity,
        state: state
      }, 200);

      if (stateResult.success && stateResult.records.length > 0) {
        let filteredRecords = stateResult.records;
        
        // If market name provided, try to find similar markets
        if (market) {
          const similarMarkets = stateResult.records.filter(record => 
            record.market && record.market.toLowerCase().includes(market.toLowerCase())
          );
          if (similarMarkets.length > 0) {
            filteredRecords = similarMarkets;
            console.log(`🔍 Found ${similarMarkets.length} records with similar market names`);
          }
        }

        marketData = transformRecords(filteredRecords.slice(0, 100));
        queryScope = 'state_level';
        console.log(`✅ Found ${marketData.length} records at state level`);
      } else {
        console.log('⚠️ No records found at state level');
      }
    }

    // Strategy 3: National commodity search (if no state-level match)
    if (marketData.length === 0) {
      console.log('🌏 Strategy 3: National commodity search');
      const nationalResult = await fetchDataGovApi({
        commodity: commodity
      }, 300);

      if (nationalResult.success && nationalResult.records.length > 0) {
        // Priority order: requested state > any state
        let prioritizedRecords = nationalResult.records;
        
        if (state) {
          const stateMatches = prioritizedRecords.filter(record => 
            record.state && record.state.toLowerCase().includes(state.toLowerCase())
          );
          if (stateMatches.length > 0) {
            prioritizedRecords = [...stateMatches, ...prioritizedRecords.filter(record => 
              !record.state || !record.state.toLowerCase().includes(state.toLowerCase())
            )];
          }
        }

        marketData = transformRecords(prioritizedRecords.slice(0, 100));
        queryScope = 'national_level';
        console.log(`✅ Found ${marketData.length} records at national level`);
      } else {
        console.log('⚠️ No records found at national level');
      }
    }

    // Cache the result
    cache.set(cacheKey, { 
      data: marketData, 
      timestamp: Date.now(),
      scope: queryScope,
      totalRecords: marketData.length
    });

    // Return response
    const response = {
      success: true,
      data: marketData,
      scope: queryScope,
      cached: false,
      timestamp: Date.now(),
      query: { commodity, state, market },
      totalRecords: marketData.length
    };

    console.log(`📤 Returning ${marketData.length} records (scope: ${queryScope})`);
    return res.status(200).json(response);

  } catch (error) {
    console.error('🚨 API Handler Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Market data service temporarily unavailable. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

