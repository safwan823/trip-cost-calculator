import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { addresses } = await request.json();

    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: 'addresses array is required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      addresses.map(async ({ address, city }) => {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              address
            )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );

          const data = await response.json();

          if (data.status === 'OK' && data.results && data.results[0]) {
            return {
              lat: data.results[0].geometry.location.lat,
              lng: data.results[0].geometry.location.lng,
              city: city || address.split(',')[0],
            };
          } else {
            console.error('[Geocode] Failed for', address, ':', data.status, data.error_message);
            return null;
          }
        } catch (error) {
          console.error('[Geocode] Error for', address, ':', error);
          return null;
        }
      })
    );

    return NextResponse.json({ locations: results.filter(r => r !== null) });
  } catch (error) {
    console.error('[Geocode] Endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to geocode addresses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
