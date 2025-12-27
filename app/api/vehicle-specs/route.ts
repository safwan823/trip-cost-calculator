import { NextRequest, NextResponse } from 'next/server';
import { VehicleSpec } from '@/types';
import { VEHICLE_DATABASE } from './database';

// Use comprehensive vehicle database from CSV as fallback (19,435 vehicles)
const POPULAR_VEHICLES: VehicleSpec[] = VEHICLE_DATABASE;

// Updated FuelEconomy.gov API base URL
const FUEL_ECONOMY_BASE_URL = 'https://www.fueleconomy.gov/ws/rest';

// Helper to extract single value from XML string
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
        try {
          // Try FuelEconomy.gov API first
          const response = await fetch(`${FUEL_ECONOMY_BASE_URL}/vehicle/menu/year`, {
            headers: { 'Accept': 'application/xml' },
          });

          if (response.ok) {
            const xml = await response.text();
            const years = extractXMLArray(xml, 'menuItem', 'value').map(y => parseInt(y));
            console.log('[VehicleSpecs] Found', years.length, 'years from API');
            return NextResponse.json({ years, source: 'api' });
          }
        } catch (error) {
          console.warn('[VehicleSpecs] API failed, using CSV fallback:', error);
        }

        // Fallback to CSV database
        const years = Array.from(new Set(POPULAR_VEHICLES.map(v => v.year))).sort((a, b) => b - a);
        console.log('[VehicleSpecs] Found', years.length, 'years from CSV fallback');
        return NextResponse.json({ years, source: 'csv' });
      }

      case 'makes': {
        const year = searchParams.get('year');
        if (!year) {
          return NextResponse.json({ error: 'Year is required' }, { status: 400 });
        }

        try {
          // Try FuelEconomy.gov API first
          const response = await fetch(`${FUEL_ECONOMY_BASE_URL}/vehicle/menu/make?year=${year}`, {
            headers: { 'Accept': 'application/xml' },
          });

          if (response.ok) {
            const xml = await response.text();
            const makes = extractXMLArray(xml, 'menuItem', 'value').sort();
            console.log('[VehicleSpecs] Found', makes.length, 'makes for year', year, 'from API');
            return NextResponse.json({ makes, source: 'api' });
          }
        } catch (error) {
          console.warn('[VehicleSpecs] API failed, using CSV fallback:', error);
        }

        // Fallback to CSV database
        const makes = Array.from(new Set(
          POPULAR_VEHICLES.filter(v => v.year === parseInt(year)).map(v => v.make)
        )).sort();

        console.log('[VehicleSpecs] Found', makes.length, 'makes for year', year, 'from CSV');
        return NextResponse.json({ makes, source: 'csv' });
      }

      case 'models': {
        const year = searchParams.get('year');
        const make = searchParams.get('make');

        if (!year || !make) {
          return NextResponse.json({ error: 'Year and make are required' }, { status: 400 });
        }

        try {
          // Try FuelEconomy.gov API first
          const response = await fetch(
            `${FUEL_ECONOMY_BASE_URL}/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`,
            { headers: { 'Accept': 'application/xml' } }
          );

          if (response.ok) {
            const xml = await response.text();
            const models = extractXMLArray(xml, 'menuItem', 'value').sort();
            console.log('[VehicleSpecs] Found', models.length, 'models for', make, year, 'from API');
            return NextResponse.json({ models, source: 'api' });
          }
        } catch (error) {
          console.warn('[VehicleSpecs] API failed, using CSV fallback:', error);
        }

        // Fallback to CSV database
        const models = Array.from(new Set(
          POPULAR_VEHICLES
            .filter(v => v.year === parseInt(year) && v.make === make)
            .map(v => v.model)
        )).sort();

        console.log('[VehicleSpecs] Found', models.length, 'models for', make, year, 'from CSV');
        return NextResponse.json({ models, source: 'csv' });
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

        // Try CSV database first (has detailed specs)
        let vehicles = POPULAR_VEHICLES.filter(
          v => v.year === parseInt(year) && v.make === make && v.model === model
        );

        // If no exact match, try case-insensitive
        if (vehicles.length === 0) {
          vehicles = POPULAR_VEHICLES.filter(
            v => v.year === parseInt(year) &&
                 v.make.toLowerCase() === make.toLowerCase() &&
                 v.model.toLowerCase() === model.toLowerCase()
          );
        }

        // If CSV has data, use it
        if (vehicles.length > 0) {
          const options = vehicles.map(v => ({
            id: v.vehicleId,
            description: `${v.fuelType} - ${v.combinedMpg} MPG combined (City: ${v.cityMpg}, Highway: ${v.highwayMpg})`,
          }));
          console.log('[VehicleSpecs] Found', options.length, 'options from CSV');
          return NextResponse.json({ options, source: 'csv' });
        }

        // If CSV has no data, try FuelEconomy.gov API
        try {
          // Try exact match first
          const response = await fetch(
            `${FUEL_ECONOMY_BASE_URL}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
            { headers: { 'Accept': 'application/xml' } }
          );

          const apiVehicleIds: string[] = [];

          if (response.ok) {
            const xml = await response.text();
            apiVehicleIds.push(...extractXMLArray(xml, 'menuItem', 'value'));
          }

          // If no exact match found, try fuzzy matching
          if (apiVehicleIds.length === 0) {
            console.log('[VehicleSpecs] No exact match for model, trying fuzzy matching...');

            // Get all models for this year/make
            const modelsResponse = await fetch(
              `${FUEL_ECONOMY_BASE_URL}/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`,
              { headers: { 'Accept': 'application/xml' } }
            );

            if (modelsResponse.ok) {
              const modelsXml = await modelsResponse.text();
              const allModels = extractXMLArray(modelsXml, 'menuItem', 'value');

              // Find models that contain our search term or vice versa
              const modelLower = model.toLowerCase();
              const fuzzyMatches = allModels.filter(apiModel => {
                const apiModelLower = apiModel.toLowerCase();
                return apiModelLower.includes(modelLower) || modelLower.includes(apiModelLower);
              });

              console.log('[VehicleSpecs] Found', fuzzyMatches.length, 'fuzzy matches:', fuzzyMatches);

              // Try each fuzzy match
              for (const fuzzyModel of fuzzyMatches) {
                const fuzzyResponse = await fetch(
                  `${FUEL_ECONOMY_BASE_URL}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(fuzzyModel)}`,
                  { headers: { 'Accept': 'application/xml' } }
                );

                if (fuzzyResponse.ok) {
                  const fuzzyXml = await fuzzyResponse.text();
                  const fuzzyIds = extractXMLArray(fuzzyXml, 'menuItem', 'value');
                  apiVehicleIds.push(...fuzzyIds);
                }
              }

              if (apiVehicleIds.length > 0) {
                console.log('[VehicleSpecs] Fuzzy matching found', apiVehicleIds.length, 'vehicle IDs');
              }
            }
          }

          // Fetch details for each vehicle ID from API
          const apiOptions = [];
          for (const apiId of apiVehicleIds.slice(0, 10)) { // Limit to 10 options
            try {
              const detailResponse = await fetch(`${FUEL_ECONOMY_BASE_URL}/vehicle/${apiId}`, {
                headers: { 'Accept': 'application/xml' }
              });

              if (detailResponse.ok) {
                const detailXml = await detailResponse.text();

                // Extract vehicle details from XML
                const cityMpg = extractXMLValue(detailXml, 'city08') || '0';
                const highwayMpg = extractXMLValue(detailXml, 'highway08') || '0';
                const combinedMpg = extractXMLValue(detailXml, 'comb08') || '0';
                const fuelType = extractXMLValue(detailXml, 'fuelType') || 'Regular';
                const trims = extractXMLValue(detailXml, 'trany') || '';

                apiOptions.push({
                  id: `api_${apiId}`,
                  description: `${fuelType} - ${combinedMpg} MPG combined (City: ${cityMpg}, Highway: ${highwayMpg}) ${trims ? `- ${trims}` : ''}`,
                  apiVehicleId: apiId,
                  cityMpg: parseInt(cityMpg),
                  highwayMpg: parseInt(highwayMpg),
                  combinedMpg: parseInt(combinedMpg),
                  fuelType: fuelType.toLowerCase().includes('premium') ? 'premium' :
                            fuelType.toLowerCase().includes('diesel') ? 'diesel' : 'regular'
                });
              }
            } catch (err) {
              console.warn('[VehicleSpecs] Failed to fetch API vehicle details:', err);
            }
          }

          if (apiOptions.length > 0) {
            console.log('[VehicleSpecs] Found', apiOptions.length, 'options from FuelEconomy.gov API');
            return NextResponse.json({ options: apiOptions, source: 'api' });
          }
        } catch (error) {
          console.warn('[VehicleSpecs] API failed for options:', error);
        }

        // No data found anywhere
        console.warn('[VehicleSpecs] No options found in CSV or API for', make, model, year);
        return NextResponse.json({ options: [], source: 'none' });
      }

      case 'details': {
        const vehicleId = searchParams.get('vehicleId');

        if (!vehicleId) {
          return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
        }

        // Check if this is an API-sourced vehicle (starts with "api_")
        if (vehicleId.startsWith('api_')) {
          const apiId = vehicleId.replace('api_', '');

          try {
            const response = await fetch(`${FUEL_ECONOMY_BASE_URL}/vehicle/${apiId}`, {
              headers: { 'Accept': 'application/xml' }
            });

            if (response.ok) {
              const xml = await response.text();

              // Extract vehicle details from API
              const year = parseInt(extractXMLValue(xml, 'year') || '0');
              const make = extractXMLValue(xml, 'make') || '';
              const model = extractXMLValue(xml, 'model') || '';
              const cityMpg = parseInt(extractXMLValue(xml, 'city08') || '0');
              const highwayMpg = parseInt(extractXMLValue(xml, 'highway08') || '0');
              const combinedMpg = parseInt(extractXMLValue(xml, 'comb08') || '0');
              const fuelTypeRaw = extractXMLValue(xml, 'fuelType') || 'Regular';

              const fuelType = fuelTypeRaw.toLowerCase().includes('premium') ? 'premium' :
                              fuelTypeRaw.toLowerCase().includes('diesel') ? 'diesel' : 'regular';

              // Estimate tank size based on vehicle class
              let tankSize = 15; // Default sedan
              if (combinedMpg < 18) {
                tankSize = 22; // Truck/SUV
              } else if (combinedMpg < 25) {
                tankSize = 18; // Larger sedan/small SUV
              } else if (combinedMpg > 35) {
                tankSize = 11; // Small car
              }

              const vehicleSpec: VehicleSpec = {
                year,
                make,
                model,
                vehicleId: parseInt(apiId),
                fuelType,
                cityMpg,
                highwayMpg,
                combinedMpg,
                tankSize,
                tankSizeSource: 'estimated'
              };

              console.log('[VehicleSpecs] Vehicle details from API:', vehicleSpec);
              return NextResponse.json(vehicleSpec);
            }
          } catch (error) {
            console.error('[VehicleSpecs] Failed to fetch API vehicle details:', error);
            return NextResponse.json({ error: 'Failed to fetch vehicle from API' }, { status: 500 });
          }
        }

        // Find vehicle in static CSV database
        const vehicle = POPULAR_VEHICLES.find(v => v.vehicleId === parseInt(vehicleId));

        if (!vehicle) {
          return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        console.log('[VehicleSpecs] Vehicle details from CSV:', vehicle);
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
