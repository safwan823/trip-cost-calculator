# Gas Price Update System

This system allows you to update gas prices either manually or automatically using the EIA.gov API.

## Current Setup

Gas prices are stored in `/data/gas-prices.json` with the following structure:

```json
{
  "lastUpdated": "2025-12-27",
  "source": "manual",
  "cities": {
    "New York": {
      "regular": 3.45,
      "premium": 4.15,
      "diesel": 3.85
    },
    ...
  }
}
```

## Manual Update

To update the timestamp without changing prices:

```bash
node scripts/update-gas-prices.js
```

This will update the `lastUpdated` field to today's date.

## Automated Update with EIA.gov API

### Step 1: Get an EIA API Key (Free)

1. Visit [https://www.eia.gov/opendata/](https://www.eia.gov/opendata/)
2. Click "Register" to create a free account
3. After logging in, you'll find your API key in the dashboard
4. Copy your API key

### Step 2: Run the Update Script

```bash
# On Windows
set EIA_API_KEY=your_api_key_here
node scripts/update-gas-prices.js

# On Mac/Linux
EIA_API_KEY=your_api_key_here node scripts/update-gas-prices.js
```

### Step 3: Set Up Automated Weekly Updates (Optional)

You can set up a GitHub Actions workflow to automatically update prices weekly:

1. Add your EIA API key as a GitHub Secret:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `EIA_API_KEY`
   - Value: Your EIA API key

2. The workflow in `.github/workflows/update-gas-prices.yml` will:
   - Run every Monday at 9 AM UTC
   - Fetch latest prices from EIA.gov
   - Update `data/gas-prices.json`
   - Commit and push the changes
   - Trigger a new deployment

## EIA API Details

The EIA (U.S. Energy Information Administration) provides:
- **Free API access** with registration
- **Weekly gasoline price data** by state and region
- **Premium, regular, and diesel prices**
- **Historical data** going back to 2000

### API Endpoint

```
https://api.eia.gov/v2/petroleum/pri/gnd/data/
```

### Parameters

- `api_key`: Your EIA API key
- `frequency`: weekly, monthly, annual
- `facets[product][]`: EPM0 (regular), EPM0F (premium), EPD0 (diesel)
- `facets[duoarea][]`: State codes (CA, NY, TX, etc.)

### Example API Call

```bash
curl "https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=YOUR_KEY&frequency=weekly&data[0]=value&facets[product][]=EPM0&facets[duoarea][]=SCA&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=1"
```

## Resources

- [EIA Open Data Portal](https://www.eia.gov/opendata/)
- [EIA API Documentation](https://www.eia.gov/opendata/documentation.php)
- [Gasoline and Diesel Fuel Update](https://www.eia.gov/petroleum/gasdiesel/)
- [U.S. Gasoline and Diesel Retail Prices](https://www.eia.gov/dnav/pet/pet_pri_gnd_dcus_nus_w.htm)

## Manual Price Updates

To manually update prices in `data/gas-prices.json`:

1. Open the file in an editor
2. Update the prices for specific cities
3. Update the `lastUpdated` field to today's date
4. Set `source` to `"manual"`
5. Save and commit the file
6. Deploy the changes

The app will automatically use the updated prices.
