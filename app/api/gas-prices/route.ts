import { NextRequest, NextResponse } from 'next/server';
import cityPricesData from '@/data/gas-prices.json';
import statePricesData from '@/data/us-state-prices.json';
import countryPricesData from '@/data/country-prices.json';

// Load gas prices from JSON files
const CITY_GAS_PRICES = cityPricesData.cities;
const STATE_GAS_PRICES = statePricesData.states;
const COUNTRY_GAS_PRICES = countryPricesData.countries;
const LAST_UPDATED = cityPricesData.lastUpdated;
const PRICE_SOURCE = cityPricesData.source;

// US State abbreviations mapping
const US_STATES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District of Columbia',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
  'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
  'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
  'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
  'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia',
  'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

// Default fallback prices if nothing found
const DEFAULT_PRICES = {
  regular: 3.50,
  premium: 4.10,
  diesel: 3.80,
};

/**
 * Extract state code from address
 * Examples:
 *  "El Paso, TX" -> "TX"
 *  "123 Main St, New York, NY 10001" -> "NY"
 */
function extractStateCode(address: string): string | null {
  const parts = address.split(',').map(p => p.trim());

  for (const part of parts) {
    // Look for state abbreviation (2 uppercase letters)
    const match = part.match(/\b([A-Z]{2})\b/);
    if (match && US_STATES[match[1] as keyof typeof US_STATES]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract country from address
 */
function extractCountry(address: string): string | null {
  const addressLower = address.toLowerCase();

  for (const country in COUNTRY_GAS_PRICES) {
    if (addressLower.includes(country.toLowerCase())) {
      return country;
    }
  }

  return null;
}

/**
 * Get gas prices for any location worldwide
 * Priority: 1. City match, 2. State match (US), 3. Country match, 4. Default
 */
function getPricesForLocation(address: string): { regular: number; premium: number; diesel: number; source: string; location: string } {
  const parts = address.split(',').map(p => p.trim());

  // 1. Try to match specific city
  for (const part of parts) {
    const cleaned = part.replace(/\d+/g, '').trim();

    for (const city in CITY_GAS_PRICES) {
      if (cleaned.toLowerCase().includes(city.toLowerCase()) ||
          city.toLowerCase().includes(cleaned.toLowerCase())) {
        return {
          ...CITY_GAS_PRICES[city],
          source: 'city',
          location: city
        };
      }
    }
  }

  // 2. Try to match US state
  const stateCode = extractStateCode(address);
  if (stateCode && STATE_GAS_PRICES[stateCode as keyof typeof STATE_GAS_PRICES]) {
    return {
      ...STATE_GAS_PRICES[stateCode as keyof typeof STATE_GAS_PRICES],
      source: 'state',
      location: `${US_STATES[stateCode as keyof typeof US_STATES]} (${stateCode})`
    };
  }

  // 3. Try to match country
  const country = extractCountry(address);
  if (country && COUNTRY_GAS_PRICES[country]) {
    return {
      ...COUNTRY_GAS_PRICES[country],
      source: 'country',
      location: country
    };
  }

  // 4. Default fallback
  return {
    ...DEFAULT_PRICES,
    source: 'default',
    location: 'Unknown'
  };
}

export async function POST(request: NextRequest) {
  try {
    const { locations, fuelGrade = 'regular' } = await request.json();

    if (!locations || locations.length === 0) {
      return NextResponse.json(
        { error: 'At least one location is required' },
        { status: 400 }
      );
    }

    console.log('[GasPrices] Fetching prices for', locations.length, 'locations');

    // Calculate average price across all locations in the route
    const locationPrices: number[] = [];
    const locationsFound: Array<{ location: string; source: string; price: number }> = [];

    for (const location of locations) {
      const address = location.address || location.city || location;
      const priceData = getPricesForLocation(address);

      const price = priceData[fuelGrade as 'regular' | 'premium' | 'diesel'] || priceData.regular;

      locationPrices.push(price);
      locationsFound.push({
        location: priceData.location,
        source: priceData.source,
        price
      });

      console.log(`[GasPrices] ${priceData.location} (${priceData.source}): $${price.toFixed(2)} (${fuelGrade})`);
    }

    // Calculate average
    const averagePrice = locationPrices.reduce((a, b) => a + b, 0) / locationPrices.length;

    console.log(`[GasPrices] Average price: $${averagePrice.toFixed(2)}`);

    return NextResponse.json({
      averagePrice,
      pricesByLocation: locationPrices,
      locations: locationsFound,
      fuelGrade,
      currency: 'usd',
      lastUpdated: LAST_UPDATED,
      dataSource: PRICE_SOURCE,
    });
  } catch (error) {
    console.error('[GasPrices] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch gas prices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
