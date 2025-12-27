import { NextRequest, NextResponse } from 'next/server';

// GasBuddy GraphQL endpoint
const GASBUDDY_API = 'https://www.gasbuddy.com/graphql';

// GraphQL query from py-gasbuddy library (verified working)
const LOCATION_QUERY_PRICES = `query LocationBySearchTerm($brandId: Int, $cursor: String, $fuel: Int, $lat: Float, $lng: Float, $maxAge: Int, $search: String) {
  locationBySearchTerm(lat: $lat, lng: $lng, search: $search) {
    stations(brandId: $brandId cursor: $cursor fuel: $fuel lat: $lat lng: $lng maxAge: $maxAge) {
      results {
        address { line1 }
        prices {
          cash { nickname postedTime price }
          credit { nickname postedTime price }
          fuelProduct
          longName
        }
        priceUnit
        currency
        id
        latitude
        longitude
        name
      }
    }
    trends {
      areaName
      country
      today
      todayLow
      trend
    }
  }
}`;

// Headers required by GasBuddy (from py-gasbuddy)
const GASBUDDY_HEADERS = {
  'Content-Type': 'application/json',
  'Sec-Fetch-Dest': '',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
  'Priority': 'u=0',
  'apollo-require-preflight': 'true',
  'Origin': 'https://www.gasbuddy.com',
  'Referer': 'https://www.gasbuddy.com/home',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
};

// In-memory cache with 15-minute TTL
const priceCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

interface GasBuddyStation {
  id: string;
  name?: string;
  address: { line1: string };
  latitude: number;
  longitude: number;
  prices: Array<{
    cash?: { price: number; postedTime: string };
    credit?: { price: number; postedTime: string };
    fuelProduct: string;
    longName: string;
  }>;
  currency: string;
  priceUnit: string;
}

interface GoogleStation {
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

export async function POST(request: NextRequest) {
  try {
    const { stations } = await request.json();

    if (!stations || !Array.isArray(stations) || stations.length === 0) {
      return NextResponse.json(
        { error: 'stations array is required' },
        { status: 400 }
      );
    }

    const prices: Array<{
      stationName: string;
      address: string;
      regularPrice?: number;
      lastUpdated?: string;
      source: 'gasbuddy' | 'regional_average';
    }> = [];

    // Group stations by approximate location to reduce API calls
    const locationGroups = groupStationsByProximity(stations as GoogleStation[]);

    const regionalPrices: number[] = [];

    for (const group of locationGroups) {
      const centerLat = group.reduce((sum, s) => sum + s.location.lat, 0) / group.length;
      const centerLng = group.reduce((sum, s) => sum + s.location.lng, 0) / group.length;

      // Check cache first
      const cacheKey = getCacheKey(centerLat, centerLng);
      const cached = priceCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[GasBuddy] Cache hit for', cacheKey);
        const gasBuddyStations = cached.data as GasBuddyStation[];

        // Match and add prices
        for (const googleStation of group) {
          const match = findBestMatch(googleStation, gasBuddyStations);
          if (match) {
            prices.push(match);
            if (match.regularPrice) {
              regionalPrices.push(match.regularPrice);
            }
          }
        }
        continue;
      }

      // Fetch from GasBuddy API
      try {
        const gasBuddyStations = await fetchGasBuddyStations(centerLat, centerLng);

        // Cache the results
        priceCache.set(cacheKey, { data: gasBuddyStations, timestamp: Date.now() });

        // Match Google stations with GasBuddy results
        for (const googleStation of group) {
          const match = findBestMatch(googleStation, gasBuddyStations);
          if (match) {
            prices.push(match);
            if (match.regularPrice) {
              regionalPrices.push(match.regularPrice);
            }
          }
        }
      } catch (error) {
        console.error('[GasBuddy] API error for location', centerLat, centerLng, error);
        // Continue with other groups even if one fails
      }
    }

    // Calculate regional average for unmatched stations
    const regionalAverage = regionalPrices.length >= 3
      ? regionalPrices.reduce((a, b) => a + b, 0) / regionalPrices.length
      : null;

    // Add regional average for stations without prices
    for (const station of stations as GoogleStation[]) {
      const hasPrice = prices.some(p => p.address === station.address);
      if (!hasPrice && regionalAverage) {
        prices.push({
          stationName: station.name,
          address: station.address,
          regularPrice: regionalAverage,
          source: 'regional_average',
        });
      }
    }

    return NextResponse.json({ prices });
  } catch (error) {
    console.error('[GasBuddy] Endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gas prices', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchGasBuddyStations(lat: number, lng: number): Promise<GasBuddyStation[]> {
  const response = await fetch(GASBUDDY_API, {
    method: 'POST',
    headers: GASBUDDY_HEADERS,
    body: JSON.stringify({
      operationName: 'LocationBySearchTerm',
      variables: {
        maxAge: 0,
        lat,
        lng,
      },
      query: LOCATION_QUERY_PRICES,
    }),
    signal: AbortSignal.timeout(10000), // 10-second timeout
  });

  if (!response.ok) {
    throw new Error(`GasBuddy API returned ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data?.locationBySearchTerm?.stations?.results || [];
}

function groupStationsByProximity(stations: GoogleStation[]): GoogleStation[][] {
  const groups: GoogleStation[][] = [];
  const grouped = new Set<number>();
  const PROXIMITY_THRESHOLD = 0.05; // ~5km

  for (let i = 0; i < stations.length; i++) {
    if (grouped.has(i)) continue;

    const group = [stations[i]];
    grouped.add(i);

    for (let j = i + 1; j < stations.length; j++) {
      if (grouped.has(j)) continue;

      const distance = Math.sqrt(
        Math.pow(stations[i].location.lat - stations[j].location.lat, 2) +
        Math.pow(stations[i].location.lng - stations[j].location.lng, 2)
      );

      if (distance < PROXIMITY_THRESHOLD) {
        group.push(stations[j]);
        grouped.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}

function findBestMatch(
  googleStation: GoogleStation,
  gasBuddyStations: GasBuddyStation[]
): {
  stationName: string;
  address: string;
  regularPrice?: number;
  lastUpdated?: string;
  source: 'gasbuddy';
} | null {
  let bestMatch: GasBuddyStation | null = null;
  let bestScore = 0;

  for (const gbStation of gasBuddyStations) {
    // Calculate proximity score
    const distance = haversineDistance(
      googleStation.location.lat,
      googleStation.location.lng,
      gbStation.latitude,
      gbStation.longitude
    );

    // Skip if too far (>100 meters)
    if (distance > 0.1) continue;

    // Calculate name similarity score
    const nameScore = calculateNameSimilarity(
      normalizeStationName(googleStation.name),
      normalizeStationName(gbStation.name || gbStation.address.line1)
    );

    // Combined score: 70% name similarity + 30% proximity
    const proximityScore = Math.max(0, 1 - distance / 0.1);
    const score = 0.7 * nameScore + 0.3 * proximityScore;

    if (score > bestScore && score > 0.7) {
      bestScore = score;
      bestMatch = gbStation;
    }
  }

  if (!bestMatch) return null;

  // Extract regular (unleaded) fuel price
  const regularFuel = bestMatch.prices.find(
    p => p.fuelProduct === 'regular_gas' || p.longName.toLowerCase().includes('regular')
  );

  const price = regularFuel?.credit?.price || regularFuel?.cash?.price;
  const lastUpdated = regularFuel?.credit?.postedTime || regularFuel?.cash?.postedTime;

  return {
    stationName: bestMatch.name || bestMatch.address.line1,
    address: bestMatch.address.line1,
    regularPrice: price,
    lastUpdated,
    source: 'gasbuddy',
  };
}

function normalizeStationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/^(shell|chevron|bp|exxon|mobil|arco|valero|speedway|marathon|sunoco|wawa|7-eleven|circlek)/i, '')
    .replace(/#\d+$/, '')
    .replace(/[^a-z0-9]/g, '');
}

function calculateNameSimilarity(name1: string, name2: string): number {
  if (name1 === name2) return 1;
  if (name1.includes(name2) || name2.includes(name1)) return 0.9;

  // Simple Levenshtein distance implementation
  const len1 = name1.length;
  const len2 = name2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = name1[i - 1] === name2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - matrix[len1][len2] / maxLen;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}
