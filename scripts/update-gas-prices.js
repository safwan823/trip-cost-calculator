const fs = require('fs');
const path = require('path');

/**
 * Script to update gas prices from EIA.gov API or manually
 *
 * Usage:
 *   Manual mode: node scripts/update-gas-prices.js
 *   EIA API mode: EIA_API_KEY=your_key node scripts/update-gas-prices.js
 *
 * To get an EIA API key:
 *   1. Visit https://www.eia.gov/opendata/
 *   2. Register for a free account
 *   3. Get your API key from the dashboard
 *   4. Set it as an environment variable: EIA_API_KEY=your_key
 */

// City to state mapping for EIA API queries
const CITY_TO_STATE = {
  'New York': 'NY',
  'Boston': 'MA',
  'Philadelphia': 'PA',
  'Washington': 'DC',
  'Baltimore': 'MD',
  'Atlanta': 'GA',
  'Miami': 'FL',
  'Charlotte': 'NC',
  'Jacksonville': 'FL',
  'Nashville': 'TN',
  'Chicago': 'IL',
  'Detroit': 'MI',
  'Indianapolis': 'IN',
  'Columbus': 'OH',
  'Milwaukee': 'WI',
  'Houston': 'TX',
  'Dallas': 'TX',
  'San Antonio': 'TX',
  'Austin': 'TX',
  'New Orleans': 'LA',
  'Los Angeles': 'CA',
  'San Francisco': 'CA',
  'San Diego': 'CA',
  'Seattle': 'WA',
  'Portland': 'OR',
  'Phoenix': 'AZ',
  'Las Vegas': 'NV',
  'Denver': 'CO',
  'Salt Lake City': 'UT',
};

// EIA API state codes (for petroleum prices)
// Series ID format: EMM_EPMR_PTE_S[STATE]_DPG (regular gasoline)
// EMM_EPMP_PTE_S[STATE]_DPG (premium gasoline)
// EMM_EPD2D_PTE_S[STATE]_DPG (diesel)

async function fetchEIAPrices() {
  const API_KEY = process.env.EIA_API_KEY;

  if (!API_KEY) {
    console.log('❌ EIA_API_KEY environment variable not set');
    console.log('ℹ️  To use EIA API, get a free key from https://www.eia.gov/opendata/');
    return null;
  }

  console.log('🔄 Fetching gas prices from EIA.gov API...');

  try {
    // Example: Fetch prices for a few states to test
    // EIA API v2 endpoint: https://api.eia.gov/v2/petroleum/pri/gnd/data/
    const BASE_URL = 'https://api.eia.gov/v2/petroleum/pri/gnd/data/';

    // Query for weekly retail gasoline prices
    const params = new URLSearchParams({
      api_key: API_KEY,
      'frequency': 'weekly',
      'data[0]': 'value',
      'facets[product][]': 'EPM0', // Regular gasoline
      'facets[duoarea][]': 'SCA', // California (example)
      'sort[0][column]': 'period',
      'sort[0][direction]': 'desc',
      'offset': '0',
      'length': '1',
    });

    const response = await fetch(`${BASE_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`EIA API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched data from EIA API');
    console.log('📊 Sample data:', JSON.stringify(data.response.data[0], null, 2));

    // TODO: Parse EIA response and map to our city structure
    // For now, return null to use manual prices
    console.log('⚠️  EIA API integration is in progress - using manual prices for now');
    return null;

  } catch (error) {
    console.error('❌ Error fetching from EIA API:', error.message);
    return null;
  }
}

async function updatePrices() {
  console.log('🚀 Starting gas price update...\n');

  // Try to fetch from EIA API
  const eiaPrices = await fetchEIAPrices();

  // Load current prices
  const pricesPath = path.join(__dirname, '../data/gas-prices.json');
  const currentPrices = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));

  if (eiaPrices) {
    // Update with EIA data
    console.log('✅ Updating prices from EIA API');
    currentPrices.cities = eiaPrices;
    currentPrices.source = 'eia-api';
  } else {
    // Manual mode - just update timestamp
    console.log('ℹ️  Using manual prices (no EIA API data)');
    currentPrices.source = 'manual';
  }

  // Update timestamp
  currentPrices.lastUpdated = new Date().toISOString().split('T')[0];

  // Write updated prices
  fs.writeFileSync(pricesPath, JSON.stringify(currentPrices, null, 2), 'utf-8');

  console.log('\n✅ Gas prices updated successfully!');
  console.log(`📁 File: ${pricesPath}`);
  console.log(`📅 Last updated: ${currentPrices.lastUpdated}`);
  console.log(`🔗 Source: ${currentPrices.source}`);
  console.log(`🏙️  Cities: ${Object.keys(currentPrices.cities).length}`);

  // Show a few sample prices
  console.log('\n💰 Sample prices:');
  Object.entries(currentPrices.cities).slice(0, 5).forEach(([city, prices]) => {
    console.log(`   ${city}: Regular $${prices.regular}, Premium $${prices.premium}, Diesel $${prices.diesel}`);
  });
}

// Run the update
updatePrices().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
