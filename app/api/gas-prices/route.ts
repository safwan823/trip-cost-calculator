import { NextRequest, NextResponse } from 'next/server';

// Average gas prices by major U.S. cities (updated periodically)
// Prices in USD per gallon
const CITY_GAS_PRICES: Record<string, { regular: number; premium: number; diesel: number }> = {
  // Northeast
  'New York': { regular: 3.45, premium: 4.15, diesel: 3.85 },
  'Boston': { regular: 3.42, premium: 4.10, diesel: 3.80 },
  'Philadelphia': { regular: 3.38, premium: 4.05, diesel: 3.75 },
  'Washington': { regular: 3.35, premium: 4.00, diesel: 3.70 },
  'Baltimore': { regular: 3.36, premium: 4.02, diesel: 3.72 },

  // Southeast
  'Atlanta': { regular: 3.15, premium: 3.75, diesel: 3.50 },
  'Miami': { regular: 3.30, premium: 3.90, diesel: 3.65 },
  'Charlotte': { regular: 3.20, premium: 3.80, diesel: 3.55 },
  'Jacksonville': { regular: 3.22, premium: 3.82, diesel: 3.57 },
  'Nashville': { regular: 3.18, premium: 3.78, diesel: 3.53 },

  // Midwest
  'Chicago': { regular: 3.55, premium: 4.20, diesel: 3.90 },
  'Detroit': { regular: 3.50, premium: 4.15, diesel: 3.85 },
  'Indianapolis': { regular: 3.25, premium: 3.85, diesel: 3.60 },
  'Columbus': { regular: 3.28, premium: 3.88, diesel: 3.63 },
  'Milwaukee': { regular: 3.45, premium: 4.05, diesel: 3.80 },

  // South
  'Houston': { regular: 3.05, premium: 3.65, diesel: 3.40 },
  'Dallas': { regular: 3.08, premium: 3.68, diesel: 3.43 },
  'San Antonio': { regular: 3.10, premium: 3.70, diesel: 3.45 },
  'Austin': { regular: 3.12, premium: 3.72, diesel: 3.47 },
  'New Orleans': { regular: 3.15, premium: 3.75, diesel: 3.50 },

  // West
  'Los Angeles': { regular: 4.85, premium: 5.45, diesel: 5.15 },
  'San Francisco': { regular: 5.15, premium: 5.75, diesel: 5.45 },
  'San Diego': { regular: 4.75, premium: 5.35, diesel: 5.05 },
  'Seattle': { regular: 4.55, premium: 5.15, diesel: 4.85 },
  'Portland': { regular: 4.45, premium: 5.05, diesel: 4.75 },
  'Phoenix': { regular: 3.65, premium: 4.25, diesel: 3.95 },
  'Las Vegas': { regular: 4.15, premium: 4.75, diesel: 4.45 },
  'Denver': { regular: 3.40, premium: 4.00, diesel: 3.70 },
  'Salt Lake City': { regular: 3.55, premium: 4.15, diesel: 3.85 },

  // Canada (CAD)
  'Toronto': { regular: 1.60, premium: 1.85, diesel: 1.70 }, // CAD per liter
  'Vancouver': { regular: 1.75, premium: 2.00, diesel: 1.85 },
  'Montreal': { regular: 1.65, premium: 1.90, diesel: 1.75 },
};

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
      pricesByCityy: cityPrices,
      cities: citiesFound,
      fuelGrade,
      currency: 'usd',
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
