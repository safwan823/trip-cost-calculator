import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get('input');

    if (!input || input.length < 3) {
      return NextResponse.json({ predictions: [] });
    }

    // Call Google Places Autocomplete (New) API
    const response = await fetch(
      `https://places.googleapis.com/v1/places:autocomplete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        },
        body: JSON.stringify({
          input: input,
          includedRegionCodes: ['us'], // Focus on US addresses
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Autocomplete API error:', errorData);
      return NextResponse.json(
        { error: 'Autocomplete failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform the response to match our frontend format
    const predictions = (data.suggestions || []).map((suggestion: {
      placePrediction?: {
        text?: { text?: string };
        placeId?: string;
      };
    }) => ({
      description: suggestion.placePrediction?.text?.text || '',
      placeId: suggestion.placePrediction?.placeId || '',
    }));

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
