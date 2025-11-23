# Market API for AGROcure

A Next.js serverless API for fetching market prices from agmarknet data.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## API Endpoints

### GET /api/market

Fetch market prices for a specific commodity in a state and market.

**Parameters:**
- `commodity` (required): Name of the commodity (e.g., "Potato", "Rice", "Wheat")
- `state` (required): Name of the state (e.g., "Karnataka", "Maharashtra")
- `market` (required): Name of the market/city (e.g., "Bangalore", "Mumbai")

**Example:**
```
GET /api/market?commodity=Potato&state=Karnataka&market=Bangalore
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "S.No": "1",
      "City": "Bangalore",
      "Commodity": "Potato",
      "Min Prize": "1500",
      "Max Prize": "1800",
      "Model Prize": "1600",
      "Date": "18 Sep 2025"
    }
  ],
  "cached": false,
  "timestamp": 1726654800000
}
```

## Deployment

Deploy to Vercel, Netlify, or any platform that supports Next.js serverless functions.

## Features

- Web scraping from agmarknet.gov.in
- 30-minute caching for improved performance
- CORS enabled for mobile app integration
- Fallback mock data for development
- Error handling and validation