# Real Indian Mandi Price Data Sources

## 🏛️ **Official Government APIs**

### 1. eNAM (National Agriculture Market)
- **Website**: https://enam.gov.in/web/
- **API Endpoint**: https://enam.gov.in/web/resources/api
- **Coverage**: 1000+ mandis across India
- **Data**: Real-time commodity prices, arrivals, trends
- **Registration**: Required for API access
- **Cost**: Free for developers

### 2. Data.gov.in Agriculture APIs
- **Website**: https://data.gov.in/
- **Search**: "agriculture market price"
- **Multiple datasets**: Various state agricultural departments
- **Format**: JSON, CSV, XML
- **Cost**: Free

### 3. AGMARKNET Alternative Endpoints
- **Direct API**: https://agmarknet.gov.in/Others/profile.aspx
- **Mobile API**: https://agmarknet.gov.in/PriceAndArrivals/DateWisePriceAndArrivals.aspx
- **State APIs**: Individual state agricultural department APIs

## 🏢 **Commercial/Reliable Sources**

### 4. Commodity India API
- **Website**: https://commodityindia.com/
- **Coverage**: Major mandis and commodity exchanges
- **Real-time**: Live price updates
- **Cost**: Paid subscription

### 5. AgriWatch API
- **Website**: https://agriwatch.com/
- **Coverage**: Pan-India market intelligence
- **Features**: Price forecasting, market analysis
- **Cost**: Subscription-based

### 6. Krishi Jagran Market API
- **Website**: https://krishijagran.com/
- **Coverage**: State-wise mandi prices
- **Updates**: Daily price updates
- **Cost**: Contact for API access

## 🔧 **Implementation Options**

### Option A: eNAM Official API (Recommended)
```javascript
// Register at eNAM for API key
const enamAPI = {
  baseUrl: 'https://enam.gov.in/web/resources/api',
  endpoints: {
    markets: '/markets',
    commodities: '/commodities',
    prices: '/prices'
  }
};
```

### Option B: Data.gov.in Datasets
```javascript
// Multiple free datasets available
const dataGovAPI = {
  baseUrl: 'https://api.data.gov.in/resource',
  datasets: [
    '9ef84268-d588-465a-a308-a864a43d0070', // AGMARKNET data
    '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69', // State market data
  ]
};
```

### Option C: Web Scraping (Legal Alternative Sites)
```javascript
// Scrape from sites that allow it
const alternativeSources = [
  'https://commodityonline.com/mandiprices',
  'https://www.commoditiescontrol.com/eagritrader/commoditywise_daily_report.aspx',
  'https://krishi.icar.gov.in/jspui/handle/123456789/6016'
];
```

## 📋 **Step-by-Step Implementation**

### Step 1: Register for eNAM API
1. Visit https://enam.gov.in/web/
2. Register as a developer
3. Apply for API access
4. Get API key and documentation

### Step 2: Update Your Market API
```javascript
// Replace agmarknet scraping with eNAM API
async function getEnamData(commodity, state, market) {
  const response = await fetch(`https://enam.gov.in/web/resources/api/prices`, {
    headers: {
      'Authorization': `Bearer ${ENAM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({
      commodity: commodity,
      state: state,
      market: market,
      date: new Date().toISOString().split('T')[0]
    })
  });
  
  return response.json();
}
```

### Step 3: Fallback to Data.gov.in
```javascript
// If eNAM fails, use data.gov.in
async function getDataGovPrices(commodity, state) {
  const response = await fetch(
    `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${DATA_GOV_KEY}&format=json&filters[commodity]=${commodity}&filters[state]=${state}`
  );
  
  return response.json();
}
```

## 🎯 **Recommended Approach**

### Primary: eNAM API
- Most reliable and official
- Real-time data
- Government-backed
- Free for developers

### Secondary: Data.gov.in
- Backup when eNAM is down
- Multiple datasets available
- Also government-official
- No registration required for some datasets

### Tertiary: Commercial APIs
- For premium features
- Better data analytics
- Paid but very reliable

## 📞 **Getting Started Today**

1. **Immediate**: Try Data.gov.in APIs (no registration)
2. **This week**: Register for eNAM API access
3. **Backup**: Implement multiple data sources

## 🔗 **Useful Links**

- eNAM Developer Portal: https://enam.gov.in/web/
- Data.gov.in Agriculture: https://data.gov.in/catalog/agriculture
- ICAR Agriculture Data: https://krishi.icar.gov.in/
- State Agricultural Departments: Individual state websites

This approach will give you **real, reliable mandi prices** from official government sources!