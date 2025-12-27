import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { locations } = await request.json();

    if (!locations || locations.length === 0) {
      return NextResponse.json(
        { error: 'At least one location is required' },
        { status: 400 }
      );
    }

    // For each location, find nearby gas stations
    const allStations: Array<{
      name: string;
      address: string;
      location: { lat: number; lng: number };
      city: string;
      priceLevel?: number;
    }> = [];

    for (const location of locations) {
      // Use Google Places API (New) to find nearby gas stations
      const response = await fetch(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.priceLevel',
          },
          body: JSON.stringify({
            includedTypes: ['gas_station'],
            maxResultCount: 5,
            locationRestriction: {
              circle: {
                center: {
                  latitude: location.lat,
                  longitude: location.lng,
                },
                radius: 5000.0, // 5km radius
              },
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.places) {
          const stations = data.places.map((place: {
            displayName?: { text?: string };
            formattedAddress?: string;
            location?: { latitude?: number; longitude?: number };
            priceLevel?: string;
          }) => ({
            name: place.displayName?.text || 'Unknown Station',
            address: place.formattedAddress || '',
            location: {
              lat: place.location?.latitude || 0,
              lng: place.location?.longitude || 0,
            },
            city: location.city || '',
            priceLevel: place.priceLevel === 'PRICE_LEVEL_INEXPENSIVE' ? 1 :
                       place.priceLevel === 'PRICE_LEVEL_MODERATE' ? 2 :
                       place.priceLevel === 'PRICE_LEVEL_EXPENSIVE' ? 3 :
                       place.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE' ? 4 : 2,
          }));

          allStations.push(...stations);
        }
      }
    }

    return NextResponse.json({ gasStations: allStations });
  } catch (error) {
    console.error('Gas station fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gas stations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
