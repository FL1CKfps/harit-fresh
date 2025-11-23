# Deploy Your Market API

## Quick Steps to Deploy Your Market API

### 1. Deploy to Vercel (Recommended)

```bash
# Navigate to your market-api folder
cd market-api

# Install Vercel CLI if you haven't already
npm install -g vercel

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? Choose your account
# - Link to existing project? N
# - Project name: agrocure-market-api
# - Directory: ./
```

### 2. Get Your Deployment URL

After deployment, Vercel will give you a URL like:
```
https://agrocure-market-api.vercel.app
```

### 3. Update MarketService

Open `services/marketService.js` and replace the baseUrl:

```javascript
// Replace this line:
this.baseUrl = 'https://agrocure-market-api.vercel.app/api';

// With your actual deployed URL:
this.baseUrl = 'https://YOUR-ACTUAL-URL.vercel.app/api';
```

### 4. Test Your API

Visit your deployed URL to test:
```
https://YOUR-URL.vercel.app/api/market?commodity=Potato&state=Karnataka&market=Bangalore
```

You should see JSON response with market data.

### 5. Restart Your React Native App

```bash
# In your harit-fresh folder
npm start
```

## Your Market API Features

✅ **Real Data**: Scrapes live prices from agmarknet.gov.in  
✅ **Smart Caching**: 30-minute cache for better performance  
✅ **CORS Enabled**: Works with mobile apps  
✅ **Error Handling**: Falls back to mock data if scraping fails  
✅ **Multiple Markets**: Supports various commodities and locations  

## Troubleshooting

- **CORS Issues**: The API includes proper CORS headers
- **Rate Limits**: Built-in caching prevents API abuse
- **Mock Data**: Automatically falls back to realistic mock data if scraping fails

## Current Status

Your MarketScreen is already configured to use the custom API! Just deploy it and update the URL.