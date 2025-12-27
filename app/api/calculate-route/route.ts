import { NextRequest, NextResponse } from 'next/server';
import { RouteLeg } from '@/types';

// Helper function to convert meters to miles
function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

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
    const requestBody: {
      origin: { address: string };
      destination: { address: string };
      travelMode: string;
      routingPreference: string;
      computeAlternativeRoutes: boolean;
      languageCode: string;
      units: string;
      intermediates?: Array<{ address: string }>;
    } = {
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
        // NEW: Added routes.legs to get segment-by-segment data
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs',
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

    // Process legs if available (segment-by-segment data)
    const legs: RouteLeg[] = route.legs?.map((leg: { distanceMeters?: number; duration?: string; startLocation?: { address?: string }; endLocation?: { address?: string }; polyline?: { encodedPolyline?: string } }) => ({
      startAddress: leg.startLocation?.address || '',
      endAddress: leg.endLocation?.address || '',
      distance: leg.distanceMeters || 0,
      distanceMiles: metersToMiles(leg.distanceMeters || 0),
      duration: parseInt(leg.duration?.replace('s', '') || '0'),
      polyline: leg.polyline?.encodedPolyline,
    })) || [];

    console.log('[CalculateRoute] Found', legs.length, 'route legs');

    return NextResponse.json({
      distance: route.distanceMeters,
      duration: parseInt(route.duration.replace('s', '')),
      polyline: route.polyline.encodedPolyline,
      legs, // NEW: Include segment data
      origin, // NEW: Include for reference
      destination, // NEW: Include for reference
      waypoints, // NEW: Include for reference
    });
  } catch (error) {
    console.error('Route calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
