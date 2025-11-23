# Market API Deployment Guide

## Quick Deployment to Vercel (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy the Market API
```bash
cd C:\Users\aksha\Desktop\AGROcure\market-api
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N** 
- Project name: **agrocure-market-api**
- Directory: **./** (current directory)

### Step 3: Get Your API URL
After deployment, Vercel will give you a URL like:
```
https://agrocure-market-api.vercel.app
```

### Step 4: Update the MarketService
1. Open `harit-fresh/services/marketService.js`
2. Replace this line:
```javascript
this.baseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
```

With your deployed URL:
```javascript
this.baseUrl = 'https://agrocure-market-api.vercel.app/api';
```

### Step 5: Test the API
Visit: `https://your-api-url.vercel.app/api/market?commodity=Potato&state=Karnataka&market=Bangalore`

## Alternative: Deploy to Netlify

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Build and Deploy
```bash
cd C:\Users\aksha\Desktop\AGROcure\market-api
npm run build
netlify deploy --prod --dir=.next
```

## Alternative: Use Railway

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the market-api folder
4. Get your deployment URL

## Testing Your Deployed API

Once deployed, test these endpoints:

### Get Market Prices
```
GET /api/market?commodity=Wheat&state=Karnataka&market=Bangalore
```

### Response Example
```json
{
  "success": true,
  "data": [
    {
      "S.No": "1",
      "City": "Bangalore",
      "Commodity": "Wheat",
      "Min Prize": "2200",
      "Max Prize": "2400", 
      "Model Prize": "2300",
      "Date": "18 Sep 2025"
    }
  ],
  "cached": false,
  "timestamp": 1726654800000
}
```

## Update React Native App

After deployment, update the MarketService URL:

```javascript
// In services/marketService.js
this.baseUrl = 'https://YOUR-DEPLOYED-URL.vercel.app/api';
```

Then restart your React Native app:
```bash
cd harit-fresh
npm start
```

## Troubleshooting

### CORS Issues
The API already includes CORS headers, but if you face issues:
1. Check the browser console for CORS errors
2. Make sure your app is making requests to the correct URL
3. Verify the API is responding correctly

### API Rate Limits
The API includes caching (30 minutes) to avoid rate limits from agmarknet.

### Mock Data Fallback
If the scraping fails, the API automatically returns realistic mock data based on actual market prices.

## Features of the Deployed API

✅ **Real Data Scraping**: Fetches live prices from agmarknet.gov.in  
✅ **Intelligent Caching**: 30-minute cache to improve performance  
✅ **CORS Enabled**: Works with mobile apps and web browsers  
✅ **Error Handling**: Graceful fallbacks to mock data  
✅ **Rate Limiting**: Prevents API abuse  
✅ **Multiple Formats**: Supports various commodities and markets  

## Next Steps

1. Deploy the market-api using one of the methods above
2. Update the marketService.js with your deployed URL
3. Test the MarketScreen in your React Native app
4. The app will now show real market prices from agmarknet!