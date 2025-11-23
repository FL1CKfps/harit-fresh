import axios from 'axios';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const state = req.query.state;
  if (!state) {
    return res.status(400).json({ success: false, error: 'Missing required parameter: state' });
  }

  const cacheKey = `markets_${state}`;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
    return res.status(200).json({ success: true, data: cached.data, cached: true });
  }

  try {
    const API_KEY = '579b464db66ec23bdd00000151d86cef0143446b7d39f7425d6afd7f';
    // Fetch a reasonably large sample for the state
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${API_KEY}&format=json&limit=1000&filters[state]=${encodeURIComponent(state)}`;
    const response = await axios.get(url, { headers: { 'Accept': 'application/json' }, timeout: 20000 });

    const records = (response.data && response.data.records) || [];

    const marketsSet = new Set();
    const districtsSet = new Set();

    for (const r of records) {
      if (r.market) marketsSet.add(r.market);
      if (r.district) districtsSet.add(r.district);
    }

    const data = {
      state,
      totalRecords: records.length,
      uniqueMarkets: Array.from(marketsSet).sort(),
      uniqueDistricts: Array.from(districtsSet).sort()
    };

    cache.set(cacheKey, { ts: Date.now(), data });

    return res.status(200).json({ success: true, data, cached: false });
  } catch (error) {
    console.error('markets API error:', error && error.message ? error.message : error);
    return res.status(500).json({ success: false, error: 'Failed to fetch markets', details: (error && error.message) || String(error) });
  }
}
