import { NextRequest, NextResponse } from 'next/server';
import { VehicleSpec } from '@/types';
import { VEHICLE_DATABASE } from './database';

// Use comprehensive vehicle database from CSV (4,563 vehicles)
const POPULAR_VEHICLES: VehicleSpec[] = VEHICLE_DATABASE;

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
