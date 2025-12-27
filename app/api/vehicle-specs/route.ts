import { NextRequest, NextResponse } from 'next/server';
import { VehicleSpec } from '@/types';

const FUEL_ECONOMY_BASE_URL = 'https://www.fueleconomy.gov/feg/ws/rest';

// Helper to extract text content from XML string
function extractXMLValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
  return match ? match[1] : null;
}

// Helper to extract all values for a tag from XML string
function extractXMLArray(xml: string, itemTag: string, valueTag: string): string[] {
  const items: string[] = [];
  const regex = new RegExp(`<${itemTag}>.*?<${valueTag}>([^<]+)</${valueTag}>.*?</${itemTag}>`, 'g');
  let match;
  while ((match = regex.exec(xml)) !== null) {
    items.push(match[1]);
  }
  return items;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    console.log('[VehicleSpecs] Request:', action, searchParams.toString());

    switch (action) {
      case 'years': {
        // Fetch available years
        const response = await fetch(`${FUEL_ECONOMY_BASE_URL}/vehicle/menu/year`, {
          headers: { 'Accept': 'application/xml' },
        });

        if (!response.ok) {
          throw new Error(`FuelEconomy.gov returned ${response.status}`);
        }

        const xml = await response.text();

        // Extract years from XML
        const years = extractXMLArray(xml, 'menuItem', 'value');
        const numericYears = years.map(y => parseInt(y)).filter(y => !isNaN(y) && y >= 2015);

        console.log('[VehicleSpecs] Found', numericYears.length, 'years');

        return NextResponse.json({ years: numericYears.sort((a, b) => b - a) });
      }

      case 'makes': {
        const year = searchParams.get('year');
        if (!year) {
          return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        }

        const response = await fetch(`${FUEL_ECONOMY_BASE_URL}/vehicle/menu/make?year=${year}`, {
          headers: { 'Accept': 'application/xml' },
        });

        if (!response.ok) {
          throw new Error(`FuelEconomy.gov returned ${response.status}`);
        }

        const xml = await response.text();
        const makes = extractXMLArray(xml, 'menuItem', 'text');

        console.log('[VehicleSpecs] Found', makes.length, 'makes for year', year);

        return NextResponse.json({ makes: makes.sort() });
      }

      case 'models': {
        const year = searchParams.get('year');
        const make = searchParams.get('make');

        if (!year || !make) {
          return NextResponse.json({ error: 'Year and make are required' }, { status: 400 });
        }

        const response = await fetch(
          `${FUEL_ECONOMY_BASE_URL}/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`,
          { headers: { 'Accept': 'application/xml' } }
        );

        if (!response.ok) {
          throw new Error(`FuelEconomy.gov returned ${response.status}`);
        }

        const xml = await response.text();
        const models = extractXMLArray(xml, 'menuItem', 'text');

        console.log('[VehicleSpecs] Found', models.length, 'models for', make, year);

        return NextResponse.json({ models: models.sort() });
      }

      case 'options': {
        const year = searchParams.get('year');
        const make = searchParams.get('make');
        const model = searchParams.get('model');

        if (!year || !make || !model) {
          return NextResponse.json(
            { error: 'Year, make, and model are required' },
            { status: 400 }
          );
        }

        const response = await fetch(
          `${FUEL_ECONOMY_BASE_URL}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
          { headers: { 'Accept': 'application/xml' } }
        );

        if (!response.ok) {
          throw new Error(`FuelEconomy.gov returned ${response.status}`);
        }

        const xml = await response.text();

        // Extract vehicle IDs and descriptions
        const options: Array<{ id: number; description: string }> = [];
        const regex = /<menuItem>.*?<value>(\d+)<\/value>.*?<text>([^<]+)<\/text>.*?<\/menuItem>/gs;
        let match;

        while ((match = regex.exec(xml)) !== null) {
          options.push({
            id: parseInt(match[1]),
            description: match[2],
          });
        }

        console.log('[VehicleSpecs] Found', options.length, 'options for', make, model, year);

        return NextResponse.json({ options });
      }

      case 'details': {
        const vehicleId = searchParams.get('vehicleId');

        if (!vehicleId) {
          return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
        }

        const response = await fetch(
          `${FUEL_ECONOMY_BASE_URL}/vehicle/${vehicleId}`,
          { headers: { 'Accept': 'application/xml' } }
        );

        if (!response.ok) {
          throw new Error(`FuelEconomy.gov returned ${response.status}`);
        }

        const xml = await response.text();

        // Extract vehicle details
        const year = extractXMLValue(xml, 'year');
        const make = extractXMLValue(xml, 'make');
        const model = extractXMLValue(xml, 'model');
        const trany = extractXMLValue(xml, 'trany');
        const city08 = extractXMLValue(xml, 'city08');
        const highway08 = extractXMLValue(xml, 'highway08');
        const comb08 = extractXMLValue(xml, 'comb08');
        const fuelType1 = extractXMLValue(xml, 'fuelType1') || extractXMLValue(xml, 'fuelType');

        // Map fuel type to our standard types
        let fuelType: 'regular' | 'premium' | 'diesel' = 'regular';
        if (fuelType1) {
          const fuelLower = fuelType1.toLowerCase();
          if (fuelLower.includes('premium') || fuelLower.includes('recommended')) {
            fuelType = 'premium';
          } else if (fuelLower.includes('diesel')) {
            fuelType = 'diesel';
          }
        }

        const spec: VehicleSpec = {
          year: parseInt(year || '0'),
          make: make || '',
          model: model || '',
          option: trany || undefined,
          vehicleId: parseInt(vehicleId),
          fuelType,
          cityMpg: parseInt(city08 || '0'),
          highwayMpg: parseInt(highway08 || '0'),
          combinedMpg: parseInt(comb08 || '0'),
          tankSize: undefined, // Not in API, will be filled by tankCapacity.ts
          tankSizeSource: 'default',
        };

        console.log('[VehicleSpecs] Vehicle details:', spec);

        return NextResponse.json(spec);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: years, makes, models, options, or details' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[VehicleSpecs] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch vehicle data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
