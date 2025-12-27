import { NextRequest, NextResponse } from 'next/server';
import gasPricesData from '@/data/gas-prices.json';

// Load gas prices from JSON file
const CITY_GAS_PRICES = gasPricesData.cities;
const LAST_UPDATED = gasPricesData.lastUpdated;
const PRICE_SOURCE = gasPricesData.source;

// Default fallback prices if city not found
const DEFAULT_PRICES = {
  regular: 3.50,
  premium: 4.10,
  diesel: 3.80,
};

/**
 * Extract city name from full address
 * Examples:
 *  "New York, NY" -> "New York"
 *  "Los Angeles, CA 90001" -> "Los Angeles"
 *  "123 Main St, Chicago, IL" -> "Chicago"
 */
function extractCityName(address: string): string {
  // Split by comma and take the first part that looks like a city
  const parts = address.split(',').map(p => p.trim());

  for (const part of parts) {
    // Remove any numbers (zip codes, street numbers)
    const cleaned = part.replace(/\d+/g, '').trim();

    // Check if this matches a known city
    for (const city in CITY_GAS_PRICES) {
      if (cleaned.toLowerCase().includes(city.toLowerCase()) ||
          city.toLowerCase().includes(cleaned.toLowerCase())) {
        return city;
      }
    }
  }

  // If no match, return the cleaned first part
  return parts[0].replace(/\d+/g, '').trim();
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

    // Calculate average price across all cities in the route
    const cityPrices: number[] = [];
    const citiesFound: string[] = [];

    for (const location of locations) {
      const address = location.address || location.city || location;
      const cityName = extractCityName(address);

      const prices = CITY_GAS_PRICES[cityName] || DEFAULT_PRICES;
      const price = prices[fuelGrade as 'regular' | 'premium' | 'diesel'] || prices.regular;

      cityPrices.push(price);
      citiesFound.push(cityName);

      console.log(`[GasPrices] ${cityName}: $${price.toFixed(2)} (${fuelGrade})`);
    }

    // Calculate average
    const averagePrice = cityPrices.reduce((a, b) => a + b, 0) / cityPrices.length;

    console.log(`[GasPrices] Average price: $${averagePrice.toFixed(2)}`);

    return NextResponse.json({
      averagePrice,
      pricesByCity: cityPrices,
      cities: citiesFound,
      fuelGrade,
      currency: 'usd',
      lastUpdated: LAST_UPDATED,
      source: PRICE_SOURCE,
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
