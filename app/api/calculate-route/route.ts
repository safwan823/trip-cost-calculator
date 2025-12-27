import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, waypoints = [] } = await request.json();

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    // Build the request body
    const requestBody: any = {
      origin: {
        address: origin,
      },
      destination: {
        address: destination,
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      languageCode: 'en-US',
      units: 'IMPERIAL',
    };

    // Add waypoints if provided
    if (waypoints && waypoints.length > 0) {
      requestBody.intermediates = waypoints.map((waypoint: string) => ({
        address: waypoint,
      }));
    }

    // Call Google Routes API
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Routes API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to calculate route', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json(
        { error: 'No route found between these locations' },
        { status: 404 }
      );
    }

    const route = data.routes[0];

    return NextResponse.json({
      distance: route.distanceMeters,
      duration: parseInt(route.duration.replace('s', '')),
      polyline: route.polyline.encodedPolyline,
    });
  } catch (error) {
    console.error('Route calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
