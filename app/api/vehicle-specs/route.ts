import { NextRequest, NextResponse } from 'next/server';
import { VehicleSpec } from '@/types';

// Static vehicle database (simplified approach since FuelEconomy.gov API has issues)
const POPULAR_VEHICLES: VehicleSpec[] = [
  // Honda
  { year: 2024, make: 'Honda', model: 'Civic', vehicleId: 1, fuelType: 'regular', cityMpg: 31, highwayMpg: 40, combinedMpg: 35, tankSize: 12.4, tankSizeSource: 'static' },
  { year: 2024, make: 'Honda', model: 'Accord', vehicleId: 2, fuelType: 'regular', cityMpg: 29, highwayMpg: 37, combinedMpg: 32, tankSize: 14.8, tankSizeSource: 'static' },
  { year: 2024, make: 'Honda', model: 'CR-V', vehicleId: 3, fuelType: 'regular', cityMpg: 28, highwayMpg: 34, combinedMpg: 30, tankSize: 14.0, tankSizeSource: 'static' },

  // Toyota
  { year: 2024, make: 'Toyota', model: 'Camry', vehicleId: 4, fuelType: 'regular', cityMpg: 28, highwayMpg: 39, combinedMpg: 32, tankSize: 15.8, tankSizeSource: 'static' },
  { year: 2024, make: 'Toyota', model: 'Corolla', vehicleId: 5, fuelType: 'regular', cityMpg: 32, highwayMpg: 41, combinedMpg: 35, tankSize: 13.2, tankSizeSource: 'static' },
  { year: 2024, make: 'Toyota', model: 'RAV4', vehicleId: 6, fuelType: 'regular', cityMpg: 27, highwayMpg: 35, combinedMpg: 30, tankSize: 14.5, tankSizeSource: 'static' },

  // Ford
  { year: 2024, make: 'Ford', model: 'F-150', vehicleId: 7, fuelType: 'regular', cityMpg: 20, highwayMpg: 26, combinedMpg: 22, tankSize: 23.0, tankSizeSource: 'static' },
  { year: 2024, make: 'Ford', model: 'Mustang', vehicleId: 8, fuelType: 'premium', cityMpg: 18, highwayMpg: 25, combinedMpg: 21, tankSize: 15.5, tankSizeSource: 'static' },
  { year: 2024, make: 'Ford', model: 'Explorer', vehicleId: 9, fuelType: 'regular', cityMpg: 21, highwayMpg: 28, combinedMpg: 24, tankSize: 18.0, tankSizeSource: 'static' },

  // Chevrolet
  { year: 2024, make: 'Chevrolet', model: 'Silverado 1500', vehicleId: 10, fuelType: 'regular', cityMpg: 17, highwayMpg: 24, combinedMpg: 20, tankSize: 24.0, tankSizeSource: 'static' },
  { year: 2024, make: 'Chevrolet', model: 'Equinox', vehicleId: 11, fuelType: 'regular', cityMpg: 26, highwayMpg: 31, combinedMpg: 28, tankSize: 14.0, tankSizeSource: 'static' },
  { year: 2024, make: 'Chevrolet', model: 'Malibu', vehicleId: 12, fuelType: 'regular', cityMpg: 29, highwayMpg: 36, combinedMpg: 32, tankSize: 15.8, tankSizeSource: 'static' },

  // Nissan
  { year: 2024, make: 'Nissan', model: 'Altima', vehicleId: 13, fuelType: 'regular', cityMpg: 28, highwayMpg: 39, combinedMpg: 32, tankSize: 16.2, tankSizeSource: 'static' },
  { year: 2024, make: 'Nissan', model: 'Rogue', vehicleId: 14, fuelType: 'regular', cityMpg: 30, highwayMpg: 37, combinedMpg: 33, tankSize: 14.5, tankSizeSource: 'static' },

  // Hyundai
  { year: 2024, make: 'Hyundai', model: 'Elantra', vehicleId: 15, fuelType: 'regular', cityMpg: 33, highwayMpg: 43, combinedMpg: 37, tankSize: 12.8, tankSizeSource: 'static' },
  { year: 2024, make: 'Hyundai', model: 'Tucson', vehicleId: 16, fuelType: 'regular', cityMpg: 26, highwayMpg: 33, combinedMpg: 29, tankSize: 14.3, tankSizeSource: 'static' },

  // Mazda
  { year: 2024, make: 'Mazda', model: 'Mazda3', vehicleId: 17, fuelType: 'regular', cityMpg: 28, highwayMpg: 36, combinedMpg: 31, tankSize: 13.2, tankSizeSource: 'static' },
  { year: 2024, make: 'Mazda', model: 'CX-5', vehicleId: 18, fuelType: 'regular', cityMpg: 25, highwayMpg: 31, combinedMpg: 27, tankSize: 15.3, tankSizeSource: 'static' },

  // Subaru
  { year: 2024, make: 'Subaru', model: 'Outback', vehicleId: 19, fuelType: 'regular', cityMpg: 26, highwayMpg: 33, combinedMpg: 29, tankSize: 18.5, tankSizeSource: 'static' },
  { year: 2024, make: 'Subaru', model: 'Forester', vehicleId: 20, fuelType: 'regular', cityMpg: 26, highwayMpg: 33, combinedMpg: 29, tankSize: 16.6, tankSizeSource: 'static' },

  // RAM
  { year: 2024, make: 'RAM', model: '1500', vehicleId: 21, fuelType: 'regular', cityMpg: 17, highwayMpg: 25, combinedMpg: 20, tankSize: 26.0, tankSizeSource: 'static' },

  // Jeep
  { year: 2024, make: 'Jeep', model: 'Grand Cherokee', vehicleId: 22, fuelType: 'regular', cityMpg: 19, highwayMpg: 26, combinedMpg: 22, tankSize: 24.6, tankSizeSource: 'static' },
  { year: 2024, make: 'Jeep', model: 'Wrangler', vehicleId: 23, fuelType: 'regular', cityMpg: 17, highwayMpg: 24, combinedMpg: 20, tankSize: 21.5, tankSizeSource: 'static' },
];

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
        // Return unique years from static database
        const years = Array.from(new Set(POPULAR_VEHICLES.map(v => v.year))).sort((a, b) => b - a);
        console.log('[VehicleSpecs] Found', years.length, 'years');
        return NextResponse.json({ years });
      }

      case 'makes': {
        const year = searchParams.get('year');
        if (!year) {
          return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        }

        // Return unique makes for the given year
        const makes = Array.from(new Set(
          POPULAR_VEHICLES.filter(v => v.year === parseInt(year)).map(v => v.make)
        )).sort();

        console.log('[VehicleSpecs] Found', makes.length, 'makes for year', year);
        return NextResponse.json({ makes });
      }

      case 'models': {
        const year = searchParams.get('year');
        const make = searchParams.get('make');

        if (!year || !make) {
          return NextResponse.json({ error: 'Year and make are required' }, { status: 400 });
        }

        // Return unique models for the given year and make
        const models = Array.from(new Set(
          POPULAR_VEHICLES
            .filter(v => v.year === parseInt(year) && v.make === make)
            .map(v => v.model)
        )).sort();

        console.log('[VehicleSpecs] Found', models.length, 'models for', make, year);
        return NextResponse.json({ models });
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

        // Find matching vehicles and return as options
        const vehicles = POPULAR_VEHICLES.filter(
          v => v.year === parseInt(year) && v.make === make && v.model === model
        );

        const options = vehicles.map(v => ({
          id: v.vehicleId,
          description: `${v.model} - ${v.fuelType} (${v.combinedMpg} MPG)`,
        }));

        console.log('[VehicleSpecs] Found', options.length, 'options for', make, model, year);
        return NextResponse.json({ options });
      }

      case 'details': {
        const vehicleId = searchParams.get('vehicleId');

        if (!vehicleId) {
          return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
        }

        // Find vehicle in static database
        const vehicle = POPULAR_VEHICLES.find(v => v.vehicleId === parseInt(vehicleId));

        if (!vehicle) {
          return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        console.log('[VehicleSpecs] Vehicle details:', vehicle);
        return NextResponse.json(vehicle);
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
