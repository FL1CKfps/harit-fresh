
import { DATA_GOV_API_KEY, CSC_API_KEY } from 'expo-env';

class MarketService {
  constructor() {
    // Data.gov.in API configuration - Direct client integration
    this.dataGovApiKey = DATA_GOV_API_KEY;
    this.dataGovBaseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    
    // Cache configuration
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.defaultCacheTime = 30 * 60 * 1000; // 30 minutes
    
    // API endpoints for Indian states and cities (CountryStateCity)
    this.statesApiUrl = 'https://api.countrystatecity.in/v1/countries/IN/states';
    this.citiesApiUrl = 'https://api.countrystatecity.in/v1/countries/IN/states/{state_iso}/cities';
    this.apiKey = CSC_API_KEY; // Free API key for countrystatecity.in

    // Initialize state and city data
    this.statesData = null;
    this.citiesData = {};
  }

  // Robust Data.gov.in API call function
  async fetchDataGovApi(filters = {}, limit = 100) {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        'api-key': this.dataGovApiKey,
        'format': 'json',
        'limit': limit.toString()
      });

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
          params.append(`filters[${key}]`, value.toString().trim());
        }
      });

      const url = `${this.dataGovBaseUrl}?${params.toString()}`;
      console.log(`📡 Data.gov.in API Call: ${url}`);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AGROcure/1.0 (Agriculture App)',
          'Cache-Control': 'no-cache'
        }
      });

      console.log(`📊 Data.gov.in Response: Status ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Records: ${data?.records?.length || 0}/${data?.total || 0}`);

        if (data && data.status === 'ok' && Array.isArray(data.records)) {
          return {
            records: data.records,
            total: data.total,
            success: true
          };
        } else {
          console.log('⚠️ Invalid API response structure:', data);
          return { records: [], total: 0, success: false };
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Data.gov.in API Error:', response.status, errorData);
        return { records: [], total: 0, success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error('❌ Data.gov.in API Network Error:', error.message);
      return { records: [], total: 0, success: false, error: error.message };
    }
  }

  // Transform API records to expected format
  transformRecords(records, source = 'data.gov.in') {
    return records.map((record, index) => ({
      "S.No": (index + 1).toString(),
      "City": record.market || record.district || 'Unknown',
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
      "Source": source
    }));
  }

  // Test function to check if Data.gov.in API is working
  async testAPI() {
    console.log('🧪 Testing Data.gov.in API connection...');
    
    try {
      const result = await this.fetchDataGovApi({ commodity: 'Tomato' }, 5);
      
      if (result.success && result.records.length > 0) {
        console.log('✅ Data.gov.in API is working! Sample records:', result.records.length);
        return { success: true, data: result.records };
      } else {
        console.log('❌ Data.gov.in API test failed:', result);
        return { success: false, error: 'No data returned from API' };
      }
    } catch (error) {
      console.log('🚫 Data.gov.in API test error:', error.message);
      return { success: false, error: error.message };
    }
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

  // Fetch Indian states from API
  async getStates() {
    try {
      // Check cache first
      const cachedStates = this.getCache('indian_states');
      if (cachedStates) {
        console.log('🌍 Returning cached states data');
        return cachedStates;
      }

      console.log('🌍 Fetching states from CountryStateCity API...');
      const response = await fetch(this.statesApiUrl, {
        headers: {
          'X-CSCAPI-KEY': this.apiKey,
          'Accept': 'application/json',
          'User-Agent': 'AGROcure/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const statesData = await response.json();
      console.log(`✅ Fetched ${statesData.length} states from API`);

      // Transform API response to simple state names
      const states = statesData.map(state => state.name);

      // Cache the result
      this.setCache('indian_states', states);

      return states;
    } catch (error) {
      console.error('❌ Error fetching states:', error);
      throw new Error('Unable to fetch states from API');
    }
  }

  // Fetch cities/districts for a state from API
  async getDistricts(stateName) {
    try {
      // Check cache first
      const cacheKey = `districts_${stateName}`;
      const cachedDistricts = this.getCache(cacheKey);
      if (cachedDistricts) {
        console.log(`🏙️ Returning cached districts for ${stateName}`);
        return cachedDistricts;
      }

      console.log(`🏙️ Fetching cities for ${stateName} from CountryStateCity API...`);

      // Get states data first if not already cached
      if (!this.statesData) {
        console.log('📋 Fetching states data first...');
        const response = await fetch(this.statesApiUrl, {
          headers: {
            'X-CSCAPI-KEY': this.apiKey,
            'Accept': 'application/json',
            'User-Agent': 'AGROcure/1.0'
          }
        });
        if (response.ok) {
          this.statesData = await response.json();
          console.log(`✅ Cached ${this.statesData.length} states for city lookups`);
        } else {
          console.error(`❌ Failed to fetch states: ${response.status}`);
        }
      }

      // Find state ISO code
      let stateIso = null;
      if (this.statesData) {
        const stateObj = this.statesData.find(state => 
          state.name.toLowerCase() === stateName.toLowerCase() ||
          state.name.toLowerCase().includes(stateName.toLowerCase()) ||
          stateName.toLowerCase().includes(state.name.toLowerCase())
        );
        stateIso = stateObj ? stateObj.iso2 : null;
        console.log(`🔍 Found state ISO for ${stateName}: ${stateIso}`);
      }

      // Fallback ISO mapping if API lookup fails
      if (!stateIso) {
        const stateMapping = {
          'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', 'Assam': 'AS', 'Bihar': 'BR',
          'Chhattisgarh': 'CT', 'Goa': 'GA', 'Gujarat': 'GJ', 'Haryana': 'HR',
          'Himachal Pradesh': 'HP', 'Jharkhand': 'JH', 'Karnataka': 'KA', 'Kerala': 'KL',
          'Madhya Pradesh': 'MP', 'Maharashtra': 'MH', 'Manipur': 'MN', 'Meghalaya': 'ML',
          'Mizoram': 'MZ', 'Nagaland': 'NL', 'Odisha': 'OR', 'Punjab': 'PB',
          'Rajasthan': 'RJ', 'Sikkim': 'SK', 'Tamil Nadu': 'TN', 'Telangana': 'TG',
          'Tripura': 'TR', 'Uttar Pradesh': 'UP', 'Uttarakhand': 'UT', 'West Bengal': 'WB',
          'Delhi': 'DL', 'Jammu and Kashmir': 'JK', 'Ladakh': 'LA'
        };
        stateIso = stateMapping[stateName];
        console.log(`🔄 Fallback ISO mapping for ${stateName}: ${stateIso}`);
      }

      if (!stateIso) {
        console.error(`❌ Could not find ISO code for state: ${stateName}`);
        throw new Error(`State ${stateName} not found in API data`);
      }

      // Fetch cities for the state
      const citiesUrl = this.citiesApiUrl.replace('{state_iso}', stateIso);
      console.log(`📡 Fetching cities from: ${citiesUrl}`);
      
      const response = await fetch(citiesUrl, {
        headers: {
          'X-CSCAPI-KEY': this.apiKey,
          'Accept': 'application/json',
          'User-Agent': 'AGROcure/1.0'
        }
      });

      if (!response.ok) {
        console.error(`❌ Cities API request failed: ${response.status} ${response.statusText}`);
        throw new Error(`API request failed: ${response.status}`);
      }

      const citiesData = await response.json();
      console.log(`✅ Fetched ${citiesData.length} cities for ${stateName}`);

      // Transform API response to district names
      const districts = citiesData.map(city => city.name);

      // Cache the result
      this.setCache(cacheKey, districts);

      return districts;
    } catch (error) {
      console.error(`❌ Error fetching cities for ${stateName}:`, error);
      throw new Error(`Unable to fetch cities for ${stateName}: ${error.message}`);
    }
  }



  // Get market prices for a commodity - Robust Data.gov.in implementation
  async getMarketPrices(commodity, state, market) {
    try {
      if (!commodity) {
        throw new Error('Commodity is required');
      }

      const cacheKey = `market_${commodity}_${state || 'all'}_${market || 'all'}`;
      
      // Check cache first
      const cachedData = this.getCache(cacheKey);
      if (cachedData) {
        console.log('📋 Returning cached market data for', commodity);
        return cachedData;
      }

      console.log(`🔍 Fetching market data for commodity: ${commodity}, state: ${state || 'any'}, market: ${market || 'any'}`);

      let marketData = [];
      let queryScope = 'none';

      // Strategy 1: Exact market match (if both state and market provided)
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
          console.log(`✅ Found ${marketData.length} records for exact market match`);
        } else {
          console.log('⚠️ No records found for exact market match');
        }
      }

      // Strategy 2: State-level search (if no exact match or only state provided)
      if (marketData.length === 0 && state) {
        console.log('🌍 Strategy 2: State-level search');
        const stateResult = await this.fetchDataGovApi({
          commodity: commodity,
          state: state
        }, 200);

        if (stateResult.success && stateResult.records.length > 0) {
          let filteredRecords = stateResult.records;
          
          // Strict state filtering to avoid cross-state results
          filteredRecords = filteredRecords.filter(record => {
            const recordState = (record.state || '').toLowerCase().trim();
            const targetState = state.toLowerCase().trim();
            
            // Exact match or very close match
            return recordState === targetState || 
                   recordState.includes(targetState) ||
                   targetState.includes(recordState);
          });
          
          // If market name provided, try to find similar markets within the same state
          if (market && filteredRecords.length > 0) {
            const exactMarketMatches = filteredRecords.filter(record => {
              const recordMarket = (record.market || '').toLowerCase().trim();
              const targetMarket = market.toLowerCase().trim();
              return recordMarket === targetMarket;
            });

            const similarMarketMatches = filteredRecords.filter(record => {
              const recordMarket = (record.market || '').toLowerCase().trim();
              const targetMarket = market.toLowerCase().trim();
              return recordMarket !== targetMarket && 
                     (recordMarket.includes(targetMarket) || targetMarket.includes(recordMarket));
            });
            
            if (exactMarketMatches.length > 0) {
              filteredRecords = exactMarketMatches;
              console.log(`🎯 Found ${exactMarketMatches.length} exact market matches in ${state}`);
            } else if (similarMarketMatches.length > 0) {
              filteredRecords = similarMarketMatches;
              console.log(`🔍 Found ${similarMarketMatches.length} similar market matches in ${state}`);
            }
            // If no market matches, keep all state results
          }

          marketData = this.transformRecords(filteredRecords.slice(0, 100));
          queryScope = 'state_level';
          console.log(`✅ Found ${marketData.length} records at state level for ${state}`);
        } else {
          console.log('⚠️ No records found at state level');
        }
      }

      // Strategy 3: National commodity search (if no state-level match)
      if (marketData.length === 0) {
        console.log('🌏 Strategy 3: National commodity search');
        const nationalResult = await this.fetchDataGovApi({
          commodity: commodity
        }, 300);

        if (nationalResult.success && nationalResult.records.length > 0) {
          // Priority order: exact state match > similar state match > any state
          let prioritizedRecords = nationalResult.records;
          
          if (state) {
            // Exact state matches first
            const exactStateMatches = prioritizedRecords.filter(record => {
              const recordState = (record.state || '').toLowerCase().trim();
              const targetState = state.toLowerCase().trim();
              return recordState === targetState;
            });

            // Similar state matches second
            const similarStateMatches = prioritizedRecords.filter(record => {
              const recordState = (record.state || '').toLowerCase().trim();
              const targetState = state.toLowerCase().trim();
              return recordState !== targetState && 
                     (recordState.includes(targetState) || targetState.includes(recordState));
            });

            // Other states last
            const otherStates = prioritizedRecords.filter(record => {
              const recordState = (record.state || '').toLowerCase().trim();
              const targetState = state.toLowerCase().trim();
              return !recordState.includes(targetState) && !targetState.includes(recordState);
            });

            // Prioritize results: exact state > similar state > others
            prioritizedRecords = [
              ...exactStateMatches,
              ...similarStateMatches,
              ...otherStates.slice(0, 50) // Limit other states to prevent too many irrelevant results
            ];

            console.log(`📊 National search prioritization: ${exactStateMatches.length} exact, ${similarStateMatches.length} similar, ${Math.min(otherStates.length, 50)} others`);
          }

          marketData = this.transformRecords(prioritizedRecords.slice(0, 100));
          queryScope = 'national_level';
          console.log(`✅ Found ${marketData.length} records at national level`);
        } else {
          console.log('⚠️ No records found at national level');
        }
      }

      // Cache the result
      this.setCache(cacheKey, marketData);
      
      console.log(`📤 Returning ${marketData.length} records (scope: ${queryScope}) for ${commodity}`);
      return marketData;

    } catch (error) {
      console.error('❌ Market data fetch error:', error);
      throw new Error(`Failed to fetch market data: ${error.message}`);
    }
  }

  // Get multiple market prices for comparison
  async getMultipleMarkets(commodity, markets) {
    try {
      const promises = markets.map(({ state, market }) =>
        this.getMarketPrices(commodity, state, market)
      );

      const results = await Promise.all(promises);

      return markets.map((market, index) => ({
        ...market,
        prices: results[index]
      }));

    } catch (error) {
      console.error('Multiple market fetch error:', error);
      return [];
    }
  }

  // Search for commodities
  async searchCommodities(searchTerm) {
    // Robust commodity search with caching, fallback list, synonyms and fuzzy matching
    const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/[\u2018\u2019\u201c\u201d']/g, "").replace(/[^a-z0-9\s]/g, '');

    const levenshtein = (a, b) => {
      // simple iterative implementation
      if (!a || !b) return (a && a.length) || (b && b.length) || 0;
      const m = a.length, n = b.length;
      const dp = Array(n + 1).fill(0).map((_, i) => i);
      for (let i = 1; i <= m; i++) {
        let prev = dp[0];
        dp[0] = i;
        for (let j = 1; j <= n; j++) {
          const tmp = dp[j];
          if (a[i - 1] === b[j - 1]) dp[j] = prev;
          else dp[j] = Math.min(prev, dp[j - 1], dp[j]) + 1;
          prev = tmp;
        }
      }
      return dp[n];
    };

    const getCommodityList = async () => {
      // Try cache
      const cached = this.getCache('commodity_list');
      if (cached) return cached;

      // Use our robust Data.gov.in API call
      try {
        console.log('🔍 Fetching commodity list from Data.gov.in...');
        const result = await this.fetchDataGovApi({}, 1000);
        
        if (result.success && result.records.length > 0) {
          const commodities = [...new Set(result.records.map(r => r.commodity).filter(Boolean))];
          console.log(`✅ Fetched ${commodities.length} commodities from Data.gov.in`);
          this.setCache('commodity_list', commodities, 24 * 60 * 60 * 1000); // 24 hours
          return commodities;
        } else {
          console.log('⚠️ No commodities found from Data.gov.in, using fallback list');
          throw new Error('No commodities found from API');
        }
      } catch (e) {
        console.warn('Commodity list from Data.gov.in failed:', e.message || e);
      }

      // Fallback: a curated local list of common commodities to avoid empty search
      const fallback = [
        'Wheat','Rice','Maize','Cotton','Sugarcane','Potato','Onion','Tomato','Brinjal','Cabbage','Cauliflower',
        'Chilli','Garlic','Ginger','Groundnut','Soybean','Mustard','Sunflower','Tea','Coffee','Banana','Mango',
        'Apple','Grapes','Orange','Lemon','Peas','Carrot','Bottle Gourd','Bitter Gourd','Okra','Drumstick'
      ];
      this.setCache('commodity_list', fallback, 24 * 60 * 60 * 1000);
      return fallback;
    };

    const term = normalize(searchTerm || '');
    if (!term) return [];

    // synonyms map (simple) - extend as needed
    const synonyms = {
      'potato': ['potato','alu','aloo'],
      'tomato': ['tomato','tamatar'],
      'cabbage': ['cabbage','cabage'],
      'cauliflower': ['cauliflower','gobhi'],
      'onion': ['onion','pyaz'],
      'wheat': ['wheat','gehun'],
      'rice': ['rice','chawal']
    };

    const commodityList = await getCommodityList();
    const normalizedList = commodityList.map(c => ({ raw: c, norm: normalize(c) }));

    // 1) exact normalized match
    let results = normalizedList.filter(c => c.norm === term).map(c=>c.raw);
    if (results.length) return results.slice(0, 10);

    // 2) check synonyms
    for (const [canon, forms] of Object.entries(synonyms)) {
      if (forms.some(f => normalize(f) === term)) {
        const matched = normalizedList.filter(c => normalize(c.raw) === canon || forms.includes(normalize(c.raw))).map(c=>c.raw);
        if (matched.length) return matched.slice(0,10);
      }
    }

    // 3) substring contains
    results = normalizedList.filter(c => c.norm.includes(term)).map(c=>c.raw);
    if (results.length) return results.slice(0, 10);

    // 4) fuzzy Levenshtein matching - compute distance ratio
    const scored = normalizedList.map(c => {
      const dist = levenshtein(c.norm, term);
      const maxLen = Math.max(c.norm.length, term.length);
      const ratio = maxLen === 0 ? 0 : dist / maxLen;
      return { raw: c.raw, norm: c.norm, dist, ratio };
    }).filter(x => x.ratio <= 0.45); // threshold - adjust if needed

    scored.sort((a,b) => a.ratio - b.ratio || a.dist - b.dist);

    return scored.slice(0, 10).map(s => s.raw);
  }

  // Fetch cities for a state from API
  async getPopularMarkets(state) {
    try {
      // Check cache first
      const cacheKey = `cities_${state}`;
      if (this.citiesData[cacheKey]) {
        return this.citiesData[cacheKey];
      }

      console.log(`Fetching cities for ${state}...`);

      // Find the state ISO code
      if (!this.statesData) {
        await this.getStates(); // This will populate statesData
      }

      const stateData = this.statesData?.find(s => s.name === state);
      if (!stateData) {
        console.log(`State ${state} not found`);
        throw new Error(`State ${state} not found in API data`);
      }

      const citiesUrl = this.citiesApiUrl.replace('{state_iso}', stateData.iso2);
      const response = await fetch(citiesUrl, {
        headers: {
          'X-CSCAPI-KEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Cities API failed: ${response.status}`);
      }

      const cities = await response.json();

      // Format cities for our app
      const formattedCities = cities.map(city => ({
        name: city.name,
        displayName: city.name
      }));

      // Cache the result
      this.citiesData[cacheKey] = formattedCities;

      console.log(`✅ Fetched ${cities.length} cities for ${state}`);
      return formattedCities;

    } catch (error) {
      console.error(`Error fetching cities for ${state}:`, error);
      throw new Error(`Unable to fetch markets for ${state}`);
    }
  }

  // Fallback markets when API fails
  getFallbackMarkets(state) {
    const marketsByState = {
      // States (29)
      'Andhra Pradesh': [
        { name: 'Visakhapatnam', displayName: 'Visakhapatnam' },
        { name: 'Vijayawada', displayName: 'Vijayawada' },
        { name: 'Guntur', displayName: 'Guntur' },
        { name: 'Nellore', displayName: 'Nellore' },
        { name: 'Kurnool', displayName: 'Kurnool' },
        { name: 'Rajahmundry', displayName: 'Rajahmundry' },
        { name: 'Tirupati', displayName: 'Tirupati' },
        { name: 'Anantapur', displayName: 'Anantapur' },
        { name: 'Chittoor', displayName: 'Chittoor' },
        { name: 'Kadapa', displayName: 'Kadapa' },
        { name: 'Eluru', displayName: 'Eluru' },
        { name: 'Ongole', displayName: 'Ongole' },
        { name: 'Machilipatnam', displayName: 'Machilipatnam' },
        { name: 'Adoni', displayName: 'Adoni' },
        { name: 'Tenali', displayName: 'Tenali' },
        { name: 'Proddatur', displayName: 'Proddatur' },
        { name: 'Hindupur', displayName: 'Hindupur' },
        { name: 'Bhimavaram', displayName: 'Bhimavaram' },
        { name: 'Madanapalle', displayName: 'Madanapalle' },
        { name: 'Guntakal', displayName: 'Guntakal' }
      ],
      'Arunachal Pradesh': [
        { name: 'Itanagar', displayName: 'Itanagar' },
        { name: 'Tawang', displayName: 'Tawang' },
        { name: 'Ziro', displayName: 'Ziro' }
      ],
      'Assam': [
        { name: 'Guwahati', displayName: 'Guwahati' },
        { name: 'Dibrugarh', displayName: 'Dibrugarh' },
        { name: 'Silchar', displayName: 'Silchar' },
        { name: 'Jorhat', displayName: 'Jorhat' },
        { name: 'Tezpur', displayName: 'Tezpur' },
        { name: 'Nagaon', displayName: 'Nagaon' },
        { name: 'Tinsukia', displayName: 'Tinsukia' },
        { name: 'Bongaigaon', displayName: 'Bongaigaon' },
        { name: 'Karimganj', displayName: 'Karimganj' },
        { name: 'Dhubri', displayName: 'Dhubri' },
        { name: 'North Lakhimpur', displayName: 'North Lakhimpur' },
        { name: 'Golaghat', displayName: 'Golaghat' },
        { name: 'Sivasagar', displayName: 'Sivasagar' },
        { name: 'Diphu', displayName: 'Diphu' },
        { name: 'Mangaldoi', displayName: 'Mangaldoi' }
      ],
      'Bihar': [
        { name: 'Patna', displayName: 'Patna' },
        { name: 'Gaya', displayName: 'Gaya' },
        { name: 'Bhagalpur', displayName: 'Bhagalpur' },
        { name: 'Muzaffarpur', displayName: 'Muzaffarpur' },
        { name: 'Darbhanga', displayName: 'Darbhanga' },
        { name: 'Bihar Sharif', displayName: 'Bihar Sharif' },
        { name: 'Arrah', displayName: 'Arrah' },
        { name: 'Begusarai', displayName: 'Begusarai' },
        { name: 'Katihar', displayName: 'Katihar' },
        { name: 'Munger', displayName: 'Munger' },
        { name: 'Chapra', displayName: 'Chapra' },
        { name: 'Siwan', displayName: 'Siwan' },
        { name: 'Sasaram', displayName: 'Sasaram' },
        { name: 'Hajipur', displayName: 'Hajipur' },
        { name: 'Dehri', displayName: 'Dehri' },
        { name: 'Bettiah', displayName: 'Bettiah' },
        { name: 'Motihari', displayName: 'Motihari' },
        { name: 'Bagaha', displayName: 'Bagaha' },
        { name: 'Purnia', displayName: 'Purnia' },
        { name: 'Saharsa', displayName: 'Saharsa' }
      ],
      'Chhattisgarh': [
        { name: 'Raipur', displayName: 'Raipur' },
        { name: 'Bilaspur', displayName: 'Bilaspur' },
        { name: 'Korba', displayName: 'Korba' },
        { name: 'Durg', displayName: 'Durg' }
      ],
      'Goa': [
        { name: 'Panaji', displayName: 'Panaji' },
        { name: 'Margao', displayName: 'Margao' },
        { name: 'Mapusa', displayName: 'Mapusa' }
      ],
      'Gujarat': [
        { name: 'Ahmedabad', displayName: 'Ahmedabad' },
        { name: 'Surat', displayName: 'Surat' },
        { name: 'Vadodara', displayName: 'Vadodara' },
        { name: 'Rajkot', displayName: 'Rajkot' },
        { name: 'Bhavnagar', displayName: 'Bhavnagar' },
        { name: 'Jamnagar', displayName: 'Jamnagar' },
        { name: 'Junagadh', displayName: 'Junagadh' },
        { name: 'Gandhinagar', displayName: 'Gandhinagar' },
        { name: 'Gandhidham', displayName: 'Gandhidham' },
        { name: 'Anand', displayName: 'Anand' },
        { name: 'Morbi', displayName: 'Morbi' },
        { name: 'Nadiad', displayName: 'Nadiad' },
        { name: 'Bharuch', displayName: 'Bharuch' },
        { name: 'Vapi', displayName: 'Vapi' },
        { name: 'Navsari', displayName: 'Navsari' },
        { name: 'Veraval', displayName: 'Veraval' },
        { name: 'Porbandar', displayName: 'Porbandar' },
        { name: 'Godhra', displayName: 'Godhra' },
        { name: 'Bhuj', displayName: 'Bhuj' },
        { name: 'Palanpur', displayName: 'Palanpur' },
        { name: 'Valsad', displayName: 'Valsad' },
        { name: 'Patan', displayName: 'Patan' },
        { name: 'Deesa', displayName: 'Deesa' },
        { name: 'Amreli', displayName: 'Amreli' }
      ],
      'Haryana': [
        { name: 'Faridabad', displayName: 'Faridabad' },
        { name: 'Gurgaon', displayName: 'Gurgaon' },
        { name: 'Panipat', displayName: 'Panipat' },
        { name: 'Ambala', displayName: 'Ambala' },
        { name: 'Karnal', displayName: 'Karnal' },
        { name: 'Hisar', displayName: 'Hisar' },
        { name: 'Rohtak', displayName: 'Rohtak' },
        { name: 'Sirsa', displayName: 'Sirsa' },
        { name: 'Yamunanagar', displayName: 'Yamunanagar' },
        { name: 'Panchkula', displayName: 'Panchkula' },
        { name: 'Bhiwani', displayName: 'Bhiwani' },
        { name: 'Bahadurgarh', displayName: 'Bahadurgarh' },
        { name: 'Jind', displayName: 'Jind' },
        { name: 'Thanesar', displayName: 'Thanesar' },
        { name: 'Kaithal', displayName: 'Kaithal' },
        { name: 'Rewari', displayName: 'Rewari' },
        { name: 'Narnaul', displayName: 'Narnaul' },
        { name: 'Pundri', displayName: 'Pundri' },
        { name: 'Kosli', displayName: 'Kosli' },
        { name: 'Palwal', displayName: 'Palwal' }
      ],
      'Himachal Pradesh': [
        { name: 'Shimla', displayName: 'Shimla' },
        { name: 'Mandi', displayName: 'Mandi' },
        { name: 'Solan', displayName: 'Solan' },
        { name: 'Dharamshala', displayName: 'Dharamshala' }
      ],
      'Jharkhand': [
        { name: 'Ranchi', displayName: 'Ranchi' },
        { name: 'Jamshedpur', displayName: 'Jamshedpur' },
        { name: 'Dhanbad', displayName: 'Dhanbad' },
        { name: 'Bokaro', displayName: 'Bokaro' },
        { name: 'Deoghar', displayName: 'Deoghar' },
        { name: 'Phusro', displayName: 'Phusro' },
        { name: 'Hazaribagh', displayName: 'Hazaribagh' },
        { name: 'Giridih', displayName: 'Giridih' },
        { name: 'Ramgarh', displayName: 'Ramgarh' },
        { name: 'Medininagar', displayName: 'Medininagar' },
        { name: 'Chirkunda', displayName: 'Chirkunda' }
      ],
      'Karnataka': [
        { name: 'Bangalore', displayName: 'Bangalore' },
        { name: 'Mysore', displayName: 'Mysore' },
        { name: 'Hubli', displayName: 'Hubli' },
        { name: 'Mangalore', displayName: 'Mangalore' },
        { name: 'Belgaum', displayName: 'Belgaum' },
        { name: 'Gulbarga', displayName: 'Gulbarga' },
        { name: 'Davangere', displayName: 'Davangere' },
        { name: 'Bellary', displayName: 'Bellary' },
        { name: 'Bijapur', displayName: 'Bijapur' },
        { name: 'Shimoga', displayName: 'Shimoga' },
        { name: 'Tumkur', displayName: 'Tumkur' },
        { name: 'Raichur', displayName: 'Raichur' },
        { name: 'Bidar', displayName: 'Bidar' },
        { name: 'Hassan', displayName: 'Hassan' },
        { name: 'Udupi', displayName: 'Udupi' },
        { name: 'Kolar', displayName: 'Kolar' },
        { name: 'Mandya', displayName: 'Mandya' },
        { name: 'Chikmagalur', displayName: 'Chikmagalur' },
        { name: 'Chitradurga', displayName: 'Chitradurga' },
        { name: 'Gadag', displayName: 'Gadag' },
        { name: 'Bagalkot', displayName: 'Bagalkot' },
        { name: 'Haveri', displayName: 'Haveri' },
        { name: 'Koppal', displayName: 'Koppal' },
        { name: 'Yadgir', displayName: 'Yadgir' },
        { name: 'Chikkaballapur', displayName: 'Chikkaballapur' }
      ],
      'Kerala': [
        { name: 'Kochi', displayName: 'Kochi' },
        { name: 'Thiruvananthapuram', displayName: 'Thiruvananthapuram' },
        { name: 'Kozhikode', displayName: 'Kozhikode' },
        { name: 'Thrissur', displayName: 'Thrissur' },
        { name: 'Kollam', displayName: 'Kollam' },
        { name: 'Palakkad', displayName: 'Palakkad' },
        { name: 'Alappuzha', displayName: 'Alappuzha' },
        { name: 'Kannur', displayName: 'Kannur' },
        { name: 'Kottayam', displayName: 'Kottayam' },
        { name: 'Malappuram', displayName: 'Malappuram' },
        { name: 'Wayanad', displayName: 'Wayanad' },
        { name: 'Idukki', displayName: 'Idukki' },
        { name: 'Pathanamthitta', displayName: 'Pathanamthitta' },
        { name: 'Kasaragod', displayName: 'Kasaragod' }
      ],
      'Madhya Pradesh': [
        { name: 'Indore', displayName: 'Indore' },
        { name: 'Bhopal', displayName: 'Bhopal' },
        { name: 'Jabalpur', displayName: 'Jabalpur' },
        { name: 'Gwalior', displayName: 'Gwalior' },
        { name: 'Ujjain', displayName: 'Ujjain' },
        { name: 'Sagar', displayName: 'Sagar' },
        { name: 'Dewas', displayName: 'Dewas' },
        { name: 'Satna', displayName: 'Satna' },
        { name: 'Ratlam', displayName: 'Ratlam' },
        { name: 'Rewa', displayName: 'Rewa' },
        { name: 'Katni', displayName: 'Katni' },
        { name: 'Singrauli', displayName: 'Singrauli' },
        { name: 'Burhanpur', displayName: 'Burhanpur' },
        { name: 'Khandwa', displayName: 'Khandwa' },
        { name: 'Morena', displayName: 'Morena' },
        { name: 'Bhind', displayName: 'Bhind' },
        { name: 'Chhindwara', displayName: 'Chhindwara' },
        { name: 'Guna', displayName: 'Guna' },
        { name: 'Shivpuri', displayName: 'Shivpuri' },
        { name: 'Vidisha', displayName: 'Vidisha' }
      ],
      'Maharashtra': [
        { name: 'Mumbai', displayName: 'Mumbai' },
        { name: 'Pune', displayName: 'Pune' },
        { name: 'Nashik', displayName: 'Nashik' },
        { name: 'Nagpur', displayName: 'Nagpur' },
        { name: 'Aurangabad', displayName: 'Aurangabad' },
        { name: 'Solapur', displayName: 'Solapur' },
        { name: 'Thane', displayName: 'Thane' },
        { name: 'Kolhapur', displayName: 'Kolhapur' },
        { name: 'Sangli', displayName: 'Sangli' },
        { name: 'Ahmednagar', displayName: 'Ahmednagar' },
        { name: 'Amravati', displayName: 'Amravati' },
        { name: 'Nanded', displayName: 'Nanded' },
        { name: 'Akola', displayName: 'Akola' },
        { name: 'Latur', displayName: 'Latur' },
        { name: 'Dhule', displayName: 'Dhule' },
        { name: 'Jalgaon', displayName: 'Jalgaon' },
        { name: 'Osmanabad', displayName: 'Osmanabad' },
        { name: 'Satara', displayName: 'Satara' },
        { name: 'Chandrapur', displayName: 'Chandrapur' },
        { name: 'Parbhani', displayName: 'Parbhani' },
        { name: 'Jalna', displayName: 'Jalna' },
        { name: 'Buldhana', displayName: 'Buldhana' },
        { name: 'Beed', displayName: 'Beed' },
        { name: 'Wardha', displayName: 'Wardha' },
        { name: 'Yavatmal', displayName: 'Yavatmal' },
        { name: 'Washim', displayName: 'Washim' },
        { name: 'Hingoli', displayName: 'Hingoli' },
        { name: 'Gadchiroli', displayName: 'Gadchiroli' },
        { name: 'Gondia', displayName: 'Gondia' }
      ],
      'Manipur': [
        { name: 'Imphal', displayName: 'Imphal' },
        { name: 'Thoubal', displayName: 'Thoubal' }
      ],
      'Meghalaya': [
        { name: 'Shillong', displayName: 'Shillong' },
        { name: 'Tura', displayName: 'Tura' }
      ],
      'Mizoram': [
        { name: 'Aizawl', displayName: 'Aizawl' },
        { name: 'Lunglei', displayName: 'Lunglei' }
      ],
      'Nagaland': [
        { name: 'Kohima', displayName: 'Kohima' },
        { name: 'Dimapur', displayName: 'Dimapur' }
      ],
      'Odisha': [
        { name: 'Bhubaneswar', displayName: 'Bhubaneswar' },
        { name: 'Cuttack', displayName: 'Cuttack' },
        { name: 'Rourkela', displayName: 'Rourkela' },
        { name: 'Berhampur', displayName: 'Berhampur' },
        { name: 'Sambalpur', displayName: 'Sambalpur' },
        { name: 'Puri', displayName: 'Puri' },
        { name: 'Balasore', displayName: 'Balasore' },
        { name: 'Bhadrak', displayName: 'Bhadrak' },
        { name: 'Baripada', displayName: 'Baripada' },
        { name: 'Jharsuguda', displayName: 'Jharsuguda' },
        { name: 'Jeypore', displayName: 'Jeypore' },
        { name: 'Barbil', displayName: 'Barbil' },
        { name: 'Khordha', displayName: 'Khordha' },
        { name: 'Balangir', displayName: 'Balangir' },
        { name: 'Rayagada', displayName: 'Rayagada' }
      ],
      'Punjab': [
        { name: 'Ludhiana', displayName: 'Ludhiana' },
        { name: 'Amritsar', displayName: 'Amritsar' },
        { name: 'Jalandhar', displayName: 'Jalandhar' },
        { name: 'Patiala', displayName: 'Patiala' },
        { name: 'Bathinda', displayName: 'Bathinda' },
        { name: 'Mohali', displayName: 'Mohali' },
        { name: 'Pathankot', displayName: 'Pathankot' },
        { name: 'Hoshiarpur', displayName: 'Hoshiarpur' },
        { name: 'Batala', displayName: 'Batala' },
        { name: 'Moga', displayName: 'Moga' },
        { name: 'Malerkotla', displayName: 'Malerkotla' },
        { name: 'Khanna', displayName: 'Khanna' },
        { name: 'Phagwara', displayName: 'Phagwara' },
        { name: 'Muktsar', displayName: 'Muktsar' },
        { name: 'Barnala', displayName: 'Barnala' },
        { name: 'Firozpur', displayName: 'Firozpur' },
        { name: 'Gurdaspur', displayName: 'Gurdaspur' },
        { name: 'Fazilka', displayName: 'Fazilka' },
        { name: 'Kapurthala', displayName: 'Kapurthala' },
        { name: 'Sangrur', displayName: 'Sangrur' }
      ],
      'Rajasthan': [
        { name: 'Jaipur', displayName: 'Jaipur' },
        { name: 'Jodhpur', displayName: 'Jodhpur' },
        { name: 'Kota', displayName: 'Kota' },
        { name: 'Bikaner', displayName: 'Bikaner' },
        { name: 'Udaipur', displayName: 'Udaipur' },
        { name: 'Ajmer', displayName: 'Ajmer' },
        { name: 'Bhilwara', displayName: 'Bhilwara' },
        { name: 'Alwar', displayName: 'Alwar' },
        { name: 'Bharatpur', displayName: 'Bharatpur' },
        { name: 'Sikar', displayName: 'Sikar' },
        { name: 'Pali', displayName: 'Pali' },
        { name: 'Sri Ganganagar', displayName: 'Sri Ganganagar' },
        { name: 'Kishangarh', displayName: 'Kishangarh' },
        { name: 'Baran', displayName: 'Baran' },
        { name: 'Dhaulpur', displayName: 'Dhaulpur' },
        { name: 'Tonk', displayName: 'Tonk' },
        { name: 'Beawar', displayName: 'Beawar' },
        { name: 'Hanumangarh', displayName: 'Hanumangarh' }
      ],
      'Sikkim': [
        { name: 'Gangtok', displayName: 'Gangtok' },
        { name: 'Namchi', displayName: 'Namchi' }
      ],
      'Tamil Nadu': [
        { name: 'Chennai', displayName: 'Chennai' },
        { name: 'Coimbatore', displayName: 'Coimbatore' },
        { name: 'Madurai', displayName: 'Madurai' },
        { name: 'Salem', displayName: 'Salem' },
        { name: 'Tirupur', displayName: 'Tirupur' },
        { name: 'Erode', displayName: 'Erode' },
        { name: 'Tiruchirappalli', displayName: 'Tiruchirappalli' },
        { name: 'Vellore', displayName: 'Vellore' },
        { name: 'Thanjavur', displayName: 'Thanjavur' },
        { name: 'Dindigul', displayName: 'Dindigul' },
        { name: 'Cuddalore', displayName: 'Cuddalore' },
        { name: 'Tirunelveli', displayName: 'Tirunelveli' },
        { name: 'Karur', displayName: 'Karur' },
        { name: 'Thoothukudi', displayName: 'Thoothukudi' },
        { name: 'Nagercoil', displayName: 'Nagercoil' },
        { name: 'Kanchipuram', displayName: 'Kanchipuram' },
        { name: 'Kumbakonam', displayName: 'Kumbakonam' },
        { name: 'Tiruvannamalai', displayName: 'Tiruvannamalai' },
        { name: 'Pollachi', displayName: 'Pollachi' },
        { name: 'Ramanathapuram', displayName: 'Ramanathapuram' },
        { name: 'Sivakasi', displayName: 'Sivakasi' },
        { name: 'Pudukkottai', displayName: 'Pudukkottai' },
        { name: 'Namakkal', displayName: 'Namakkal' },
        { name: 'Dharmapuri', displayName: 'Dharmapuri' },
        { name: 'Krishnagiri', displayName: 'Krishnagiri' }
      ],
      'Telangana': [
        { name: 'Hyderabad', displayName: 'Hyderabad' },
        { name: 'Warangal', displayName: 'Warangal' },
        { name: 'Nizamabad', displayName: 'Nizamabad' },
        { name: 'Karimnagar', displayName: 'Karimnagar' },
        { name: 'Ramagundam', displayName: 'Ramagundam' },
        { name: 'Khammam', displayName: 'Khammam' },
        { name: 'Mahbubnagar', displayName: 'Mahbubnagar' },
        { name: 'Nalgonda', displayName: 'Nalgonda' },
        { name: 'Adilabad', displayName: 'Adilabad' },
        { name: 'Suryapet', displayName: 'Suryapet' },
        { name: 'Miryalaguda', displayName: 'Miryalaguda' },
        { name: 'Jagtial', displayName: 'Jagtial' },
        { name: 'Mancherial', displayName: 'Mancherial' },
        { name: 'Sangareddy', displayName: 'Sangareddy' },
        { name: 'Medak', displayName: 'Medak' },
        { name: 'Siddipet', displayName: 'Siddipet' }
      ],
      'Tripura': [
        { name: 'Agartala', displayName: 'Agartala' },
        { name: 'Udaipur', displayName: 'Udaipur' }
      ],
      'Uttar Pradesh': [
        { name: 'Lucknow', displayName: 'Lucknow' },
        { name: 'Kanpur', displayName: 'Kanpur' },
        { name: 'Agra', displayName: 'Agra' },
        { name: 'Varanasi', displayName: 'Varanasi' },
        { name: 'Meerut', displayName: 'Meerut' },
        { name: 'Allahabad', displayName: 'Allahabad' },
        { name: 'Ghaziabad', displayName: 'Ghaziabad' },
        { name: 'Bareilly', displayName: 'Bareilly' },
        { name: 'Aligarh', displayName: 'Aligarh' },
        { name: 'Moradabad', displayName: 'Moradabad' },
        { name: 'Saharanpur', displayName: 'Saharanpur' },
        { name: 'Gorakhpur', displayName: 'Gorakhpur' },
        { name: 'Firozabad', displayName: 'Firozabad' },
        { name: 'Jhansi', displayName: 'Jhansi' },
        { name: 'Muzaffarnagar', displayName: 'Muzaffarnagar' },
        { name: 'Mathura', displayName: 'Mathura' },
        { name: 'Rampur', displayName: 'Rampur' },
        { name: 'Shahjahanpur', displayName: 'Shahjahanpur' },
        { name: 'Faizabad', displayName: 'Faizabad' },
        { name: 'Mau', displayName: 'Mau' },
        { name: 'Hapur', displayName: 'Hapur' },
        { name: 'Noida', displayName: 'Noida' },
        { name: 'Etawah', displayName: 'Etawah' },
        { name: 'Mirzapur', displayName: 'Mirzapur' },
        { name: 'Bulandshahr', displayName: 'Bulandshahr' },
        { name: 'Sambhal', displayName: 'Sambhal' },
        { name: 'Amroha', displayName: 'Amroha' },
        { name: 'Hardoi', displayName: 'Hardoi' },
        { name: 'Fatehpur', displayName: 'Fatehpur' },
        { name: 'Raebareli', displayName: 'Raebareli' }
      ],
      'Uttarakhand': [
        { name: 'Dehradun', displayName: 'Dehradun' },
        { name: 'Haridwar', displayName: 'Haridwar' },
        { name: 'Roorkee', displayName: 'Roorkee' },
        { name: 'Haldwani', displayName: 'Haldwani' }
      ],
      'West Bengal': [
        { name: 'Kolkata', displayName: 'Kolkata' },
        { name: 'Howrah', displayName: 'Howrah' },
        { name: 'Durgapur', displayName: 'Durgapur' },
        { name: 'Asansol', displayName: 'Asansol' },
        { name: 'Siliguri', displayName: 'Siliguri' },
        { name: 'Malda', displayName: 'Malda' },
        { name: 'Bardhaman', displayName: 'Bardhaman' },
        { name: 'Baharampur', displayName: 'Baharampur' },
        { name: 'Habra', displayName: 'Habra' },
        { name: 'Kharagpur', displayName: 'Kharagpur' },
        { name: 'Shantipur', displayName: 'Shantipur' },
        { name: 'Dankuni', displayName: 'Dankuni' },
        { name: 'Serampore', displayName: 'Serampore' },
        { name: 'Champdani', displayName: 'Champdani' },
        { name: 'Krishnanagar', displayName: 'Krishnanagar' },
        { name: 'Raniganj', displayName: 'Raniganj' },
        { name: 'Haldia', displayName: 'Haldia' },
        { name: 'Raiganj', displayName: 'Raiganj' },
        { name: 'Midnapore', displayName: 'Midnapore' },
        { name: 'Cooch Behar', displayName: 'Cooch Behar' }
      ],

      // Union Territories (8)
      'Andaman and Nicobar Islands': [
        { name: 'Port Blair', displayName: 'Port Blair' }
      ],
      'Chandigarh': [
        { name: 'Chandigarh', displayName: 'Chandigarh' }
      ],
      'Dadra and Nagar Haveli and Daman and Diu': [
        { name: 'Daman', displayName: 'Daman' },
        { name: 'Diu', displayName: 'Diu' },
        { name: 'Silvassa', displayName: 'Silvassa' }
      ],
      'Delhi': [
        { name: 'New Delhi', displayName: 'New Delhi' },
        { name: 'Delhi', displayName: 'Delhi' }
      ],
      'Jammu and Kashmir': [
        { name: 'Srinagar', displayName: 'Srinagar' },
        { name: 'Jammu', displayName: 'Jammu' }
      ],
      'Ladakh': [
        { name: 'Leh', displayName: 'Leh' },
        { name: 'Kargil', displayName: 'Kargil' }
      ],
      'Lakshadweep': [
        { name: 'Kavaratti', displayName: 'Kavaratti' }
      ],
      'Puducherry': [
        { name: 'Puducherry', displayName: 'Puducherry' },
        { name: 'Karaikal', displayName: 'Karaikal' }
      ]
    };

    return marketsByState[state] || [];
  }



  // AI Market Analysis Algorithm
  async getAIMarketAnalysis(priceData, commodity, userIntention = 'sell') {
    try {
      console.log('🤖 Starting AI Market Analysis for:', commodity, 'Intention:', userIntention);

      if (!priceData || priceData.length < 2) {
        console.log('⚠️ Insufficient data - returning fallback response');
        return {
          recommendation: 'HOLD',
          confidence: 'LOW',
          reasoning: 'Insufficient data for analysis. Need at least 2 days of price data.',
          action: 'Wait for more market data before making decisions.'
        };
      }

      // Convert price data to numbers for analysis
      const prices = priceData.map(item => ({
        date: item.Date,
        min: parseInt(item['Min Prize']),
        max: parseInt(item['Max Prize']),
        model: parseInt(item['Model Prize'])
      })).reverse(); // Reverse to get chronological order

      console.log('📊 Price data prepared for AI:', prices.length, 'data points');

      // Generate AI recommendation using real API data
      const recommendation = await this.generateAIRecommendation(prices, commodity, userIntention);

      return recommendation;

    } catch (error) {
      console.error('❌ AI Market Analysis error:', error);
      console.log('🔄 Falling back to algorithmic analysis');

      // Fallback to algorithmic analysis if AI fails
      const analysis = this.calculateMarketIndicators(prices);
      return this.generateRecommendation(analysis, commodity, userIntention);
    }
  }

  // Generate AI recommendation using real market data
  async generateAIRecommendation(prices, commodity, userIntention) {
    try {
      console.log('🚀 Calling AI API for market analysis...');

      // Import AI service
      const { default: apiManager } = await import('./apiManager');

      // Prepare structured market data for AI
      const latestPrice = prices[prices.length - 1];
      const previousPrice = prices[prices.length - 2];
      const weekAgoPrice = prices[Math.max(0, prices.length - 7)];

      const priceChange = ((latestPrice.model - previousPrice.model) / previousPrice.model * 100);
      const weeklyChange = ((latestPrice.model - weekAgoPrice.model) / weekAgoPrice.model * 100);

      // Calculate volatility
      const modelPrices = prices.map(p => p.model);
      const avg = modelPrices.reduce((a, b) => a + b, 0) / modelPrices.length;
      const variance = modelPrices.reduce((acc, price) => acc + Math.pow(price - avg, 2), 0) / modelPrices.length;
      const volatility = Math.sqrt(variance) / avg * 100;

      const marketDataSummary = `
CURRENT MARKET DATA for ${commodity}:
- Current Price: ₹${latestPrice.model}/quintal (Min: ₹${latestPrice.min}, Max: ₹${latestPrice.max})
- Yesterday's Price: ₹${previousPrice.model}/quintal
- Week Ago Price: ₹${weekAgoPrice.model}/quintal
- Daily Change: ${priceChange.toFixed(2)}%
- Weekly Change: ${weeklyChange.toFixed(2)}%
- Market Volatility: ${volatility.toFixed(2)}%
- Price Range (Last 7 days): ₹${Math.min(...modelPrices.slice(-7))}-₹${Math.max(...modelPrices.slice(-7))}/quintal
- Data Points Available: ${prices.length} days

RECENT PRICE TREND (Last 5 days):
${prices.slice(-5).map(p => `${p.date}: ₹${p.model}/quintal`).join('\n')}`;

      const prompt = `You are an expert agricultural market analyst in India. A farmer wants to ${userIntention} ${commodity}.

${marketDataSummary}

FARMER'S INTENTION: ${userIntention && typeof userIntention === 'string' ? userIntention.toUpperCase() : 'UNKNOWN'} ${commodity}

Based on this REAL market data, provide a specific recommendation:

1. **RECOMMENDATION**: Should the farmer ${userIntention} now? (SELL NOW/BUY NOW/WAIT/HOLD)

2. **CONFIDENCE LEVEL**: HIGH/MEDIUM/LOW

3. **REASONING**: Explain your analysis based on the actual price data, trends, and market conditions

4. **ACTION PLAN**: Specific steps the farmer should take

5. **RISK FACTORS**: What could go wrong with this recommendation

6. **TIMING**: Best time of day/week to execute this decision

Consider:
- Current price trends and volatility
- Whether prices are at recent highs/lows
- Market momentum direction
- Seasonal factors for ${commodity}
- Risk vs reward for a ${userIntention}ing farmer

Be specific and practical. This farmer needs actionable advice based on real market data.

IMPORTANT: Start your response with your recommendation (SELL NOW/BUY NOW/WAIT/HOLD) and confidence level (HIGH/MEDIUM/LOW) clearly stated.

Format your response clearly with sections for easy reading.`;

      console.log('📤 Sending AI request with real market data');
      const response = await apiManager.generateContent(prompt);

      if (response && (response.text || typeof response === 'string')) {
        const responseText = response.text || response;
        console.log('✅ Received AI response:', responseText.substring(0, 100) + '...');

        // Parse AI response to extract structured data
        const aiText = responseText || '';
        let recommendation = 'HOLD';
        let confidence = 'MEDIUM';

        // Extract recommendation - handle both structured and unstructured responses
        const upperText = aiText && typeof aiText === 'string' ? aiText.toUpperCase() : '';

        if (upperText.includes('SELL NOW') || upperText.includes('SELL IMMEDIATELY')) {
          recommendation = 'SELL NOW';
        } else if (upperText.includes('BUY NOW') || upperText.includes('BUY IMMEDIATELY')) {
          recommendation = 'BUY NOW';
        } else if (upperText.includes('WAIT') || upperText.includes('POSTPONE')) {
          recommendation = userIntention === 'sell' ? 'WAIT (Don\'t Sell)' : 'WAIT (Don\'t Buy)';
        } else if (upperText.includes('HOLD')) {
          recommendation = 'MONITOR CLOSELY';
        }

        // Extract confidence - handle different formats
        if (upperText.includes('HIGH CONFIDENCE') || upperText.includes('CONFIDENCE: HIGH') || upperText.includes('CONFIDENCE LEVEL\nHIGH')) {
          confidence = 'HIGH';
        } else if (upperText.includes('LOW CONFIDENCE') || upperText.includes('CONFIDENCE: LOW') || upperText.includes('CONFIDENCE LEVEL\nLOW')) {
          confidence = 'LOW';
        } else if (upperText.includes('MEDIUM CONFIDENCE') || upperText.includes('CONFIDENCE: MEDIUM') || upperText.includes('CONFIDENCE LEVEL\nMEDIUM')) {
          confidence = 'MEDIUM';
        }

        // Calculate momentum indicator for consistency with fallback
        const upDays = prices.slice(-5).reduce((count, price, index) => {
          if (index === 0) return count;
          return prices[index].model > prices[index - 1].model ? count + 1 : count;
        }, 0);
        const downDays = 4 - upDays; // Last 5 days excluding first
        const momentum = upDays > downDays ? 'Positive' : upDays < downDays ? 'Negative' : 'Neutral';

        return {
          recommendation,
          confidence,
          reasoning: aiText,
          action: `AI Analysis: ${recommendation} - Based on real market data analysis`,
          technicalData: {
            dailyChange: `${priceChange > 0 ? '+' : ''}${priceChange.toFixed(1)}%`,
            overallTrend: `${weeklyChange > 0 ? '+' : ''}${weeklyChange.toFixed(1)}%`, // Use weekly change as overall trend
            weeklyChange: `${weeklyChange > 0 ? '+' : ''}${weeklyChange.toFixed(1)}%`,
            volatility: `${volatility.toFixed(1)}%`,
            momentum: momentum,
            currentPrice: `₹${latestPrice.model}/quintal`,
            dataSource: 'Real AgMarkNet API Data'
          }
        };
      } else {
        throw new Error('No AI response received');
      }

    } catch (error) {
      console.error('❌ AI API call failed:', error);
      console.log('🔄 Using fallback algorithmic analysis');

      // Fallback to algorithmic analysis
      const analysis = this.calculateMarketIndicators(prices);
      const fallbackResult = this.generateRecommendation(analysis, commodity, userIntention);

      // Add indicator that this is fallback
      fallbackResult.reasoning = `⚠️ AI service unavailable. Algorithmic Analysis: ${fallbackResult.reasoning}`;

      return fallbackResult;
    }
  }

  // Calculate comprehensive market indicators
  calculateMarketIndicators(prices) {
    const modelPrices = prices.map(p => p.model);
    const maxPrices = prices.map(p => p.max);
    const minPrices = prices.map(p => p.min);

    // 1. Price Trend Analysis
    const currentPrice = modelPrices[modelPrices.length - 1];
    const previousPrice = modelPrices[modelPrices.length - 2];
    const firstPrice = modelPrices[0];

    const dailyChange = ((currentPrice - previousPrice) / previousPrice) * 100;
    const overallTrend = ((currentPrice - firstPrice) / firstPrice) * 100;

    // 2. Volatility Analysis
    const priceChanges = [];
    for (let i = 1; i < modelPrices.length; i++) {
      const change = ((modelPrices[i] - modelPrices[i - 1]) / modelPrices[i - 1]) * 100;
      priceChanges.push(Math.abs(change));
    }
    const avgVolatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;

    // 3. Price Range Analysis
    const currentRange = ((prices[prices.length - 1].max - prices[prices.length - 1].min) / prices[prices.length - 1].model) * 100;
    const avgRange = prices.reduce((sum, p) => sum + ((p.max - p.min) / p.model) * 100, 0) / prices.length;

    // 4. Momentum Analysis
    let upDays = 0;
    let downDays = 0;
    for (let i = 1; i < modelPrices.length; i++) {
      if (modelPrices[i] > modelPrices[i - 1]) upDays++;
      else if (modelPrices[i] < modelPrices[i - 1]) downDays++;
    }
    const momentum = (upDays - downDays) / (upDays + downDays);

    // 5. Price Position Analysis
    const recentHigh = Math.max(...modelPrices.slice(-3));
    const recentLow = Math.min(...modelPrices.slice(-3));
    const pricePosition = ((currentPrice - recentLow) / (recentHigh - recentLow)) * 100;

    return {
      currentPrice,
      dailyChange,
      overallTrend,
      volatility: avgVolatility,
      momentum,
      pricePosition,
      rangeAnalysis: currentRange - avgRange,
      upDays,
      downDays,
      dataPoints: prices.length
    };
  }

  // Generate smart recommendation based on analysis
  generateRecommendation(analysis, commodity, userIntention = 'sell') {
    const {
      dailyChange,
      overallTrend,
      volatility,
      momentum,
      pricePosition,
      rangeAnalysis,
      upDays,
      downDays
    } = analysis;

    let recommendation = 'HOLD';
    let confidence = 'MEDIUM';
    let reasoning = '';
    let action = '';

    // Intention-based analysis scoring
    let favorableScore = 0;
    let unfavorableScore = 0;
    let waitScore = 0;

    // Factor 1: Recent Price Trend Analysis
    if (userIntention === 'sell') {
      if (dailyChange > 3) {
        favorableScore += 3; // Excellent for selling
        reasoning += `Excellent selling opportunity with strong daily gain (+${dailyChange.toFixed(1)}%). `;
      } else if (dailyChange > 0) {
        favorableScore += 1;
        reasoning += `Positive price movement (+${dailyChange.toFixed(1)}%) favors selling. `;
      } else if (dailyChange < -3) {
        unfavorableScore += 2;
        reasoning += `Price dropped ${dailyChange.toFixed(1)}%, not ideal for selling. `;
      } else {
        waitScore += 1;
        reasoning += `Stable price (${dailyChange.toFixed(1)}%), consider waiting for better rates. `;
      }
    } else { // buying
      if (dailyChange < -3) {
        favorableScore += 3; // Excellent for buying
        reasoning += `Great buying opportunity with price drop (${dailyChange.toFixed(1)}%). `;
      } else if (dailyChange < 0) {
        favorableScore += 1;
        reasoning += `Price decline (${dailyChange.toFixed(1)}%) creates buying opportunity. `;
      } else if (dailyChange > 3) {
        unfavorableScore += 2;
        reasoning += `Price surged +${dailyChange.toFixed(1)}%, expensive to buy now. `;
      } else {
        waitScore += 1;
        reasoning += `Stable price (+${dailyChange.toFixed(1)}%), reasonable for buying. `;
      }
    }

    // Factor 2: Overall Trend Analysis
    if (userIntention === 'sell') {
      if (overallTrend > 15) {
        favorableScore += 3; // Perfect selling trend
        reasoning += `Strong uptrend (+${overallTrend.toFixed(1)}%) - excellent time to sell. `;
      } else if (overallTrend > 5) {
        favorableScore += 2;
        reasoning += `Upward trend (+${overallTrend.toFixed(1)}%) supports selling. `;
      } else if (overallTrend < -10) {
        unfavorableScore += 3;
        reasoning += `Falling trend (${overallTrend.toFixed(1)}%), avoid selling. `;
      } else {
        waitScore += 1;
        reasoning += `Sideways trend (${overallTrend.toFixed(1)}%), wait for better momentum. `;
      }
    } else { // buying
      if (overallTrend < -10) {
        favorableScore += 2; // Good buying opportunity in downtrend
        reasoning += `Downtrend (${overallTrend.toFixed(1)}%) creates buying opportunity. `;
      } else if (overallTrend > 15) {
        unfavorableScore += 3; // Too expensive to buy in strong uptrend
        reasoning += `Strong uptrend (+${overallTrend.toFixed(1)}%) makes buying expensive. `;
      } else {
        favorableScore += 1;
        reasoning += `Moderate trend (${overallTrend.toFixed(1)}%) allows for strategic buying. `;
      }
    }

    // Factor 3: Price Position Analysis
    if (userIntention === 'sell') {
      if (pricePosition > 85) {
        favorableScore += 3; // Near recent high, perfect for selling
        reasoning += `Price at ${pricePosition.toFixed(0)}% of recent range - perfect selling level. `;
      } else if (pricePosition > 60) {
        favorableScore += 1;
        reasoning += `Price above average range (${pricePosition.toFixed(0)}%) - good for selling. `;
      } else if (pricePosition < 30) {
        unfavorableScore += 2;
        reasoning += `Price at low end (${pricePosition.toFixed(0)}%) - poor selling time. `;
      }
    } else { // buying
      if (pricePosition < 20) {
        favorableScore += 3; // Near recent low, perfect for buying
        reasoning += `Price at ${pricePosition.toFixed(0)}% of recent range - excellent buying opportunity. `;
      } else if (pricePosition < 40) {
        favorableScore += 2;
        reasoning += `Price below average (${pricePosition.toFixed(0)}%) - good buying level. `;
      } else if (pricePosition > 80) {
        unfavorableScore += 2;
        reasoning += `Price near high (${pricePosition.toFixed(0)}%) - expensive to buy. `;
      }
    }

    // Factor 4: Volatility Impact
    if (volatility > 8) {
      waitScore += 2; // High volatility, wait regardless of intention
      reasoning += `High volatility (${volatility.toFixed(1)}%) - wait for market stability. `;
    } else if (volatility < 2) {
      favorableScore += 1; // Low volatility good for any action
      reasoning += `Low volatility (${volatility.toFixed(1)}%) - stable market conditions. `;
    }

    // Factor 5: Momentum Check
    if (userIntention === 'sell') {
      if (momentum > 0.4) {
        favorableScore += 2; // Strong upward momentum favors selling
        reasoning += `Strong upward momentum (${upDays} up vs ${downDays} down days) - sell now. `;
      } else if (momentum < -0.4) {
        unfavorableScore += 1;
        reasoning += `Downward momentum (${downDays} down vs ${upDays} up days) - hold off selling. `;
      }
    } else { // buying
      if (momentum < -0.4) {
        favorableScore += 1; // Downward momentum may create buying opportunity
        reasoning += `Downward momentum may signal buying opportunity. `;
      } else if (momentum > 0.4) {
        unfavorableScore += 1;
        reasoning += `Strong upward momentum makes buying expensive. `;
      }
    }

    // Determine final recommendation based on intention
    const totalFavorable = favorableScore;
    const totalUnfavorable = unfavorableScore;
    const totalWait = waitScore;

    if (totalFavorable >= totalWait + 1 && totalFavorable > totalUnfavorable) {
      recommendation = userIntention === 'sell' ? 'SELL NOW' : 'BUY NOW';
      confidence = totalFavorable >= 6 ? 'HIGH' : 'MEDIUM';
      action = userIntention === 'sell'
        ? `Strong recommendation to sell ${commodity}. Market conditions are favorable for profit-taking.`
        : `Good time to buy ${commodity}. Market conditions present buying opportunity.`;
    } else if (totalUnfavorable > totalFavorable) {
      recommendation = userIntention === 'sell' ? 'HOLD (Don\'t Sell)' : 'WAIT (Don\'t Buy)';
      confidence = 'MEDIUM';
      action = userIntention === 'sell'
        ? `Not recommended to sell ${commodity} now. Wait for better market conditions.`
        : `Not ideal to buy ${commodity} currently. Wait for price correction.`;
    } else {
      recommendation = 'MONITOR CLOSELY';
      confidence = 'MEDIUM';
      action = `Mixed signals for ${commodity}. Monitor market closely before making ${userIntention} decisions.`;
    }

    // Add seasonal insights
    reasoning += this.getSeasonalInsights(commodity);

    return {
      recommendation,
      confidence,
      reasoning: reasoning.trim(),
      action,
      technicalData: {
        dailyChange: `${dailyChange > 0 ? '+' : ''}${dailyChange.toFixed(1)}%`,
        overallTrend: `${overallTrend > 0 ? '+' : ''}${overallTrend.toFixed(1)}%`,
        volatility: `${volatility.toFixed(1)}%`,
        momentum: momentum > 0 ? 'Positive' : momentum < 0 ? 'Negative' : 'Neutral',
        pricePosition: `${pricePosition.toFixed(0)}% of range`
      }
    };
  }

  // Get seasonal insights for specific commodities
  getSeasonalInsights(commodity) {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const insights = {
      'Wheat': {
        3: 'Harvest season approaching, prices may soften.',
        4: 'Peak harvest period, expect lower prices.',
        5: 'Post-harvest, prices typically stabilize.',
        11: 'Sowing season, demand for good quality seeds increases.'
      },
      'Rice': {
        6: 'Monsoon impact on prices expected.',
        10: 'Kharif harvest season, prices may decline.',
        11: 'Peak rice harvest, supply increases.',
        12: 'Post-harvest storage decisions critical.'
      },
      'Cotton': {
        10: 'Cotton picking season starts, fresh supply coming.',
        11: 'Peak cotton harvest, prices under pressure.',
        3: 'Pre-planting period, last chance for good prices.',
        4: 'New crop planting, old crop clearing time.'
      }
    };

    const seasonalAdvice = insights[commodity]?.[currentMonth];
    return seasonalAdvice ? ` Seasonal factor: ${seasonalAdvice}` : '';
  }

  // Get price trend analysis
  async getPriceTrend(commodity, state, market, days = 7) {
    try {
      const data = await this.getMarketPrices(commodity, state, market);

      // Calculate trend from available data
      const prices = data.map(item => parseInt(item['Model Prize'] || item['Min Prize'] || '0'));
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

      const trend = prices.length > 1 ?
        (prices[0] - prices[prices.length - 1]) / prices[prices.length - 1] * 100 : 0;

      return {
        averagePrice: Math.round(avgPrice),
        trend: Math.round(trend * 100) / 100, // Round to 2 decimal places
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
        dataPoints: data.length
      };

    } catch (error) {
      console.error('Price trend error:', error);
      return {
        averagePrice: 0,
        trend: 0,
        direction: 'stable',
        dataPoints: 0
      };
    }
  }

  // AI-powered Transportation Cost Calculator
  async getAITransportationCost(crop, distanceKm, state, market) {
    try {
      // Import AI service for transport calculations
      const { default: apiManager } = await import('./apiManager');

      // Get current weather data for route conditions
      let weatherCondition = 'normal';
      try {
        const { default: weatherService } = await import('./weatherService');
        const weatherData = await weatherService.getCurrentWeather();
        if (weatherData && weatherData.weather && weatherData.weather[0]) {
          const condition = weatherData.weather[0].main.toLowerCase();
          weatherCondition = condition.includes('rain') ? 'rainy' :
            condition.includes('storm') ? 'stormy' :
              condition.includes('clear') ? 'clear' : 'normal';
        }
      } catch (weatherError) {
        console.log('Weather data unavailable, using normal conditions');
      }

      // Determine crop characteristics for transport
      const cropData = this.getCropTransportCharacteristics(crop);

      // Create AI prompt for transport cost calculation
      const prompt = `You are an expert logistics and transportation cost analyst for agricultural products in India.

TASK: Calculate accurate transportation cost for ${crop} over ${distanceKm}km route from ${market}, ${state}.

CROP DETAILS:
- Crop: ${crop}
- Characteristics: ${cropData.description}
- Fragility: ${cropData.fragility}
- Storage Requirements: ${cropData.storage}
- Typical Load Density: ${cropData.density}

ROUTE CONDITIONS:
- Distance: ${distanceKm} km
- Current Weather: ${weatherCondition}
- Origin: ${market}, ${state}
- Transport Mode: Most suitable for this crop and distance

CALCULATION FACTORS TO CONSIDER:
1. Fuel costs (current diesel prices in India ₹90-95/liter)
2. Vehicle type and capacity optimization
3. Driver wages and time
4. Toll charges and permits
5. Weather impact on transport time/costs
6. Crop-specific handling requirements
7. Loading/unloading costs
8. Insurance and risk factors
9. Return journey considerations
10. Seasonal demand fluctuations

PROVIDE:
1. Total cost per quintal (100kg)
2. Cost breakdown (fuel, labor, other)
3. Recommended vehicle type
4. Estimated transport time
5. Risk factors and weather impact
6. Cost-saving tips for farmers

Format as clear, practical advice for Indian farmers. Give specific rupee amounts and practical recommendations.`;

      const response = await apiManager.generateContent(prompt);

      if (response && response.text) {
        return {
          analysis: response.text,
          routeTips: this.getRouteOptimizationTips(distanceKm, weatherCondition, crop)
        };
      } else {
        // Fallback calculation if AI fails
        return this.calculateFallbackTransportCost(crop, distanceKm, state, weatherCondition);
      }

    } catch (error) {
      console.error('AI Transportation cost error:', error);
      return this.calculateFallbackTransportCost(crop, distanceKm, state, 'normal');
    }
  }

  // Get crop-specific transport characteristics
  getCropTransportCharacteristics(crop) {
    const cropCharacteristics = {
      'Wheat': {
        fragility: 'Low',
        storage: 'Dry, covered transport required',
        density: 'High - 75-80 bags per truck',
        description: 'Grain crop - robust, requires moisture protection'
      },
      'Rice': {
        fragility: 'Low',
        storage: 'Dry, ventilated transport',
        density: 'High - 70-75 bags per truck',
        description: 'Grain crop - moisture sensitive, needs proper ventilation'
      },
      'Cotton': {
        fragility: 'Medium',
        storage: 'Dry, compressed bales',
        density: 'Medium - 400-500 bales per truck',
        description: 'Fiber crop - needs compression, moisture protection'
      },
      'Potato': {
        fragility: 'High',
        storage: 'Cool, ventilated, avoid sunlight',
        density: 'Medium - 200-250 bags per truck',
        description: 'Perishable vegetable - requires careful handling, temperature control'
      },
      'Tomato': {
        fragility: 'Very High',
        storage: 'Cool, ventilated, immediate transport',
        density: 'Low - 150-200 crates per truck',
        description: 'Highly perishable - needs refrigeration for long distance'
      },
      'Onion': {
        fragility: 'Medium',
        storage: 'Dry, well-ventilated',
        density: 'Medium - 200-300 bags per truck',
        description: 'Semi-perishable - good ventilation essential'
      },
      'Sugarcane': {
        fragility: 'Low',
        storage: 'Open transport acceptable',
        density: 'Very High - 15-20 tons per truck',
        description: 'Bulky crop - immediate processing required'
      }
    };

    return cropCharacteristics[crop] || {
      fragility: 'Medium',
      storage: 'Standard agricultural transport',
      density: 'Medium - standard truck capacity',
      description: 'General agricultural commodity'
    };
  }

  // Route optimization tips based on conditions
  getRouteOptimizationTips(distanceKm, weatherCondition, crop) {
    let tips = `🚛 ROUTE OPTIMIZATION TIPS for ${crop} (${distanceKm}km):\n\n`;

    // Distance-based tips
    if (distanceKm < 50) {
      tips += '• LOCAL TRANSPORT: Use smaller vehicles for cost efficiency\n';
      tips += '• Consider multiple smaller loads vs one large load\n';
      tips += '• Peak hour avoidance can save 20-30% time\n';
    } else if (distanceKm < 200) {
      tips += '• REGIONAL TRANSPORT: Medium trucks optimal\n';
      tips += '• Plan for highway tolls (₹2-4 per km on average)\n';
      tips += '• Night travel reduces traffic, saves fuel\n';
    } else {
      tips += '• LONG DISTANCE: Large trucks for economies of scale\n';
      tips += '• Multiple permits may be required\n';
      tips += '• Consider rail transport for bulk quantities\n';
    }

    // Weather-based tips
    if (weatherCondition === 'rainy') {
      tips += '\n🌧️ MONSOON CONDITIONS:\n';
      tips += '• Add 25-40% extra time for delays\n';
      tips += '• Waterproof covering essential\n';
      tips += '• Check road conditions before departure\n';
      tips += '• Higher insurance recommended\n';
    } else if (weatherCondition === 'stormy') {
      tips += '\n⛈️ STORM CONDITIONS:\n';
      tips += '• Consider delaying transport if possible\n';
      tips += '• Extra securing and covering required\n';
      tips += '• Monitor weather updates continuously\n';
    }

    // Crop-specific tips
    const cropSpecificTips = {
      'Tomato': '• Use refrigerated transport for >100km\n• Load during cool morning hours\n• Avoid stacking more than 4 crates high',
      'Potato': '• Cover with jute bags to prevent greening\n• Ensure good ventilation\n• Avoid transport during peak summer',
      'Cotton': '• Ensure bales are properly compressed\n• Waterproof covering mandatory\n• Check moisture content before loading',
      'Wheat': '• Check grain moisture (<14% for transport)\n• Use covered vehicles only\n• Avoid loading in rainy conditions',
      'Rice': '• Proper drying before transport essential\n• Use breathable bags to prevent heating\n• Regular quality checks during long journeys'
    };

    if (cropSpecificTips[crop]) {
      const cropName = crop && typeof crop === 'string' ? crop.toUpperCase() : 'CROP';
      tips += `\n🌾 ${cropName} SPECIFIC:\n${cropSpecificTips[crop]}\n`;
    }

    tips += '\n💡 COST SAVINGS:\n';
    tips += '• Book return cargo to reduce costs by 30-40%\n';
    tips += '• Group with other farmers for bulk rates\n';
    tips += '• Negotiate better rates for regular routes\n';
    tips += '• Maintain good relationships with transporters';

    return tips;
  }

  // Fallback calculation when AI is not available
  calculateFallbackTransportCost(crop, distanceKm, state, weatherCondition) {
    let baseCostPerKm = 2.5; // Base rate per km per quintal

    // Distance-based adjustments
    if (distanceKm < 50) baseCostPerKm = 3.0; // Higher per-km cost for short distances
    else if (distanceKm > 200) baseCostPerKm = 2.0; // Lower per-km cost for long distances

    // Crop-specific adjustments
    const cropMultiplier = {
      'Tomato': 1.5, 'Potato': 1.3, 'Cotton': 1.2,
      'Wheat': 1.0, 'Rice': 1.0, 'Onion': 1.1,
      'Sugarcane': 0.8
    };

    const multiplier = cropMultiplier[crop] || 1.0;
    const weatherMultiplier = weatherCondition === 'rainy' ? 1.3 : weatherCondition === 'stormy' ? 1.5 : 1.0;

    const costPerQuintal = Math.round(baseCostPerKm * distanceKm * multiplier * weatherMultiplier);

    const analysis = `🚛 TRANSPORT COST ESTIMATE for ${crop}

📍 Route: ${distanceKm}km journey
💰 Estimated Cost: ₹${costPerQuintal} per quintal

🔍 COST BREAKDOWN:
• Base Transport: ₹${Math.round(baseCostPerKm * distanceKm)}
• Crop Handling: ${((multiplier - 1) * 100).toFixed(0)}% premium
• Weather Impact: ${((weatherMultiplier - 1) * 100).toFixed(0)}% adjustment
• Loading/Unloading: Included

⚠️ FACTORS CONSIDERED:
• Current fuel prices (₹92-95/liter)
• Standard truck capacity and rates
• ${crop} handling requirements
• ${weatherCondition} weather conditions
• Typical route characteristics

💡 RECOMMENDATIONS:
• For distances over 200km, consider rail transport
• Group shipments with other farmers for better rates
• Plan transport during favorable weather
• Negotiate return cargo to reduce costs

Note: This is an estimated cost. Actual rates may vary based on specific route conditions, fuel prices, and market demand.`;

    return {
      analysis,
      routeTips: this.getRouteOptimizationTips(distanceKm, weatherCondition, crop)
    };
  }
}

export default new MarketService();