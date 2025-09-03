# Demo Mode Setup Instructions

This document explains how to configure and run the property review application in **demo mode** - a safe version that uses sanitized sample data and prevents any real data storage or external API calls.

## Quick Setup

1. **Copy the demo environment file:**
   ```bash
   cp .env.demo .env.local
   ```

2. **Start the application:**
   ```bash
   npm run dev
   ```

3. **Access the demo:** Open your browser to `http://localhost:5173`

The application will now run in demo mode with:
- 🎭 Demo banner at the top
- Sample property data instead of real data
- No external API calls
- Memory-only storage (no persistence)
- Sanitized user information

## Demo Mode Features

### 🔒 Data Safety
- **No real data storage**: All data is kept in memory only
- **Sanitized sample data**: Real property information is replaced with demo data
- **No external API calls**: All backend communication is mocked
- **No file uploads**: Image uploads are simulated but not stored

### 🎭 Demo User Experience
- Demo banner shows at the top of the application
- Sample properties with realistic but fake data
- Demo user names prefixed with "Demo_"
- Realistic delays simulated for API calls
- All functionality works normally but safely

### 📊 Sample Data Included
- **Demo Properties:**
  - ABC Manufacturing Corp (Manufacturing facility)
  - XYZ Restaurant Group (Fast food restaurant)
  - Demo Office Solutions (Professional office)
- **Complete Slide Templates:** All 12 slide types with sample data
- **Placeholder Images:** SVG placeholders for all image slides
- **Sample ISO Codes:** Common business classification codes
- **Demo Users:** Pre-configured demo user accounts

### 🎯 Full Demo Workflow
Each demo project includes all slide types:
1. **Property Information** - Basic property details
2. **Aerial View - Google** - Satellite imagery placeholder
3. **Aerial View - Bing** - Alternative satellite view
4. **Street View** - Street-level imagery placeholder
5. **Interior** - Interior photography placeholder
6. **Website** - Company website screenshot placeholder
7. **Online Presence** - Social media analysis
8. **Ratings** - Customer review analysis
9. **Crime Rate** - Local crime statistics
10. **Fire Hazard** - Fire risk assessment
11. **Nearest Fire Station** - Emergency response analysis
12. **Comments** - Final assessment summary

## Configuration Options

Edit `.env.local` to customize demo behavior:

```env
# Core demo mode toggle
VITE_DEMO_MODE=true

# UI features
VITE_DEMO_SHOW_BANNER=true
VITE_DEMO_DISABLE_EXTERNAL_APIS=true
VITE_DEMO_USE_MOCK_DATA=true
VITE_DEMO_MEMORY_ONLY_STORAGE=true
```

## Switching Between Modes

### Enable Demo Mode
```bash
# Copy demo configuration
cp .env.demo .env.local
npm run dev
```

### Enable Production Mode
```bash
# Remove demo configuration
rm .env.local
# Or set VITE_DEMO_MODE=false in .env.local
npm run dev
```

## Demo vs Production Comparison

| Feature | Demo Mode | Production Mode |
|---------|-----------|----------------|
| Data Storage | Memory only | Database + localStorage |
| API Calls | Mocked | Real backend |
| User Data | Sanitized samples | Real user input |
| File Uploads | Simulated | Real file storage |
| Data Persistence | None | Full persistence |
| External Services | Disabled | Active |

## Technical Implementation

The demo mode is implemented using:

- **Service Factory Pattern**: Switches between real and demo services
- **Mock Services**: 
  - `demoApiService.js` - Mocks all backend calls
  - `demoProjectSaveService.js` - Memory-only project storage
  - `demoIsoCodeService.js` - Sample ISO code data
- **Data Sanitization**: Replaces sensitive data with safe samples
- **UI Indicators**: Demo banner and visual cues

## Files Created for Demo Mode

```
src/
├── config/
│   └── demoConfig.js              # Demo configuration and sample data
├── services/
│   ├── demoApiService.js          # Mock API service
│   ├── demoProjectSaveService.js  # Mock storage service
│   ├── demoIsoCodeService.js      # Mock ISO code service
│   └── serviceFactory.js          # Service selection logic
├── components/
│   └── DemoBanner.jsx             # Demo mode banner
└── .env.demo                      # Demo environment config
```

## Security Notes

✅ **Safe for Demos:**
- No real data is transmitted or stored
- All external API calls are blocked
- User input is sanitized
- No persistent storage

⚠️ **Remember:**
- Demo mode is for demonstration only
- Switch to production mode for real use
- Demo data is reset on page refresh
- No real functionality is affected

## Troubleshooting

**Demo banner not showing?**
- Check that `VITE_DEMO_MODE=true` in `.env.local`
- Restart the development server

**Still seeing real data?**
- Ensure `.env.local` exists with demo configuration
- Clear browser cache and reload

**API calls still going through?**
- Verify service factory is importing demo services
- Check browser console for demo service logs (🎭 prefix)

**Need to test real functionality?**
- Remove `.env.local` or set `VITE_DEMO_MODE=false`
- Restart the development server

---

For questions about demo mode implementation, check the source code in the files listed above.