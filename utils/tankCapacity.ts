import { VehicleSpec } from '@/types';

// Static database for common 2015-2025 vehicles
// Format: "year|make|model" -> tank capacity in gallons
export const TANK_CAPACITY_DATABASE: Record<string, number> = {
  // Honda
  '2024|Honda|Civic': 12.4,
  '2023|Honda|Civic': 12.4,
  '2022|Honda|Civic': 12.4,
  '2024|Honda|Accord': 14.8,
  '2023|Honda|Accord': 14.8,
  '2022|Honda|Accord': 14.8,
  '2024|Honda|CR-V': 14.0,
  '2023|Honda|CR-V': 14.0,
  '2022|Honda|CR-V': 14.0,
  '2024|Honda|Pilot': 19.5,
  '2023|Honda|Pilot': 19.5,

  // Toyota
  '2024|Toyota|Camry': 15.8,
  '2023|Toyota|Camry': 15.8,
  '2022|Toyota|Camry': 15.8,
  '2024|Toyota|Corolla': 13.2,
  '2023|Toyota|Corolla': 13.2,
  '2022|Toyota|Corolla': 13.2,
  '2024|Toyota|RAV4': 14.5,
  '2023|Toyota|RAV4': 14.5,
  '2022|Toyota|RAV4': 14.5,
  '2024|Toyota|Highlander': 17.1,
  '2023|Toyota|Highlander': 17.1,
  '2024|Toyota|Tacoma': 21.1,
  '2023|Toyota|Tacoma': 21.1,

  // Ford
  '2024|Ford|F-150': 23.0,
  '2023|Ford|F-150': 23.0,
  '2022|Ford|F-150': 23.0,
  '2024|Ford|Mustang': 15.5,
  '2023|Ford|Mustang': 15.5,
  '2024|Ford|Explorer': 18.0,
  '2023|Ford|Explorer': 18.0,
  '2024|Ford|Escape': 14.0,
  '2023|Ford|Escape': 14.0,
  '2024|Ford|Edge': 15.7,

  // Chevrolet
  '2024|Chevrolet|Silverado 1500': 24.0,
  '2023|Chevrolet|Silverado 1500': 24.0,
  '2022|Chevrolet|Silverado 1500': 24.0,
  '2024|Chevrolet|Equinox': 14.0,
  '2023|Chevrolet|Equinox': 14.0,
  '2024|Chevrolet|Malibu': 15.8,
  '2023|Chevrolet|Malibu': 15.8,
  '2024|Chevrolet|Tahoe': 24.0,
  '2023|Chevrolet|Tahoe': 24.0,

  // Nissan
  '2024|Nissan|Altima': 16.2,
  '2023|Nissan|Altima': 16.2,
  '2024|Nissan|Rogue': 14.5,
  '2023|Nissan|Rogue': 14.5,
  '2024|Nissan|Sentra': 12.3,
  '2023|Nissan|Sentra': 12.3,
  '2024|Nissan|Pathfinder': 19.5,

  // Hyundai
  '2024|Hyundai|Elantra': 12.8,
  '2023|Hyundai|Elantra': 12.8,
  '2024|Hyundai|Sonata': 15.9,
  '2023|Hyundai|Sonata': 15.9,
  '2024|Hyundai|Tucson': 14.3,
  '2023|Hyundai|Tucson': 14.3,
  '2024|Hyundai|Santa Fe': 17.7,

  // Mazda
  '2024|Mazda|Mazda3': 13.2,
  '2023|Mazda|Mazda3': 13.2,
  '2024|Mazda|CX-5': 15.3,
  '2023|Mazda|CX-5': 15.3,
  '2024|Mazda|CX-9': 19.5,

  // Subaru
  '2024|Subaru|Outback': 18.5,
  '2023|Subaru|Outback': 18.5,
  '2024|Subaru|Forester': 16.6,
  '2023|Subaru|Forester': 16.6,
  '2024|Subaru|Crosstrek': 16.6,

  // Jeep
  '2024|Jeep|Grand Cherokee': 24.6,
  '2023|Jeep|Grand Cherokee': 24.6,
  '2024|Jeep|Wrangler': 21.5,
  '2023|Jeep|Wrangler': 21.5,
  '2024|Jeep|Cherokee': 15.8,

  // RAM
  '2024|RAM|1500': 26.0,
  '2023|RAM|1500': 26.0,
  '2022|RAM|1500': 26.0,

  // GMC
  '2024|GMC|Sierra 1500': 24.0,
  '2023|GMC|Sierra 1500': 24.0,
  '2024|GMC|Acadia': 19.4,

  // Volkswagen
  '2024|Volkswagen|Jetta': 13.2,
  '2023|Volkswagen|Jetta': 13.2,
  '2024|Volkswagen|Tiguan': 15.3,
  '2023|Volkswagen|Tiguan': 15.3,

  // Kia
  '2024|Kia|Forte': 13.2,
  '2023|Kia|Forte': 13.2,
  '2024|Kia|Sportage': 16.4,
  '2023|Kia|Sportage': 16.4,
  '2024|Kia|Sorento': 17.7,

  // Mercedes-Benz
  '2024|Mercedes-Benz|C-Class': 17.4,
  '2023|Mercedes-Benz|C-Class': 17.4,
  '2024|Mercedes-Benz|E-Class': 21.1,

  // BMW
  '2024|BMW|3 Series': 15.6,
  '2023|BMW|3 Series': 15.6,
  '2024|BMW|5 Series': 18.5,
  '2024|BMW|X3': 17.2,
  '2024|BMW|X5': 21.9,

  // Audi
  '2024|Audi|A4': 16.9,
  '2023|Audi|A4': 16.9,
  '2024|Audi|Q5': 19.8,
  '2023|Audi|Q5': 19.8,

  // Lexus
  '2024|Lexus|ES': 15.9,
  '2023|Lexus|ES': 15.9,
  '2024|Lexus|RX': 19.2,
  '2023|Lexus|RX': 19.2,

  // Acura
  '2024|Acura|Integra': 12.8,
  '2024|Acura|TLX': 17.2,
  '2024|Acura|MDX': 19.5,

  // Tesla (for reference, though electric)
  '2024|Tesla|Model 3': 0, // Electric, no gas tank
  '2024|Tesla|Model Y': 0,
  '2024|Tesla|Model S': 0,
  '2024|Tesla|Model X': 0,

  // Dodge
  '2024|Dodge|Charger': 18.5,
  '2023|Dodge|Charger': 18.5,
  '2024|Dodge|Durango': 24.6,
};

/**
 * Estimate tank size based on vehicle specifications
 * Priority: static database > heuristic estimation > default fallback
 */
export function estimateTankSize(spec: VehicleSpec): {
  tankSize: number;
  source: 'static' | 'estimated' | 'default';
} {
  // 1. Check static database
  const key = `${spec.year}|${spec.make}|${spec.model}`;
  if (TANK_CAPACITY_DATABASE[key]) {
    console.log('[TankCapacity] Found in static database:', key, '=', TANK_CAPACITY_DATABASE[key]);
    return {
      tankSize: TANK_CAPACITY_DATABASE[key],
      source: 'static',
    };
  }

  // 2. Try without year (fallback for newer/older models)
  const makeModel = `${spec.make}|${spec.model}`;
  for (const dbKey in TANK_CAPACITY_DATABASE) {
    if (dbKey.endsWith(makeModel)) {
      console.log('[TankCapacity] Found similar model:', dbKey, '=', TANK_CAPACITY_DATABASE[dbKey]);
      return {
        tankSize: TANK_CAPACITY_DATABASE[dbKey],
        source: 'static',
      };
    }
  }

  // 3. Heuristic estimation based on vehicle class (using combined MPG)
  console.log('[TankCapacity] Using heuristic estimation for', makeModel);
  const estimatedSize = estimateByVehicleClass(spec);

  return {
    tankSize: estimatedSize,
    source: 'estimated',
  };
}

/**
 * Estimate tank size based on vehicle class and fuel efficiency
 * Higher MPG typically = smaller vehicle = smaller tank
 */
function estimateByVehicleClass(spec: VehicleSpec): number {
  const mpg = spec.combinedMpg;
  const make = spec.make.toLowerCase();
  const model = spec.model.toLowerCase();

  // Diesel vehicles typically have larger tanks
  if (spec.fuelType === 'diesel') {
    return 22.0;
  }

  // Check for truck/SUV keywords
  const isTruck =
    model.includes('f-150') ||
    model.includes('silverado') ||
    model.includes('sierra') ||
    model.includes('ram') ||
    model.includes('tacoma') ||
    model.includes('tundra') ||
    model.includes('titan');

  const isSUV =
    model.includes('explorer') ||
    model.includes('tahoe') ||
    model.includes('suburban') ||
    model.includes('yukon') ||
    model.includes('durango') ||
    model.includes('pilot') ||
    model.includes('highlander') ||
    model.includes('pathfinder') ||
    model.includes('4runner');

  if (isTruck) {
    return 24.0; // Full-size truck average
  }

  if (isSUV) {
    return 20.0; // Full-size SUV average
  }

  // MPG-based heuristic
  if (mpg >= 50) return 10.5; // Hybrid/very efficient (Prius, etc.)
  if (mpg >= 40) return 11.5; // High efficiency (small cars)
  if (mpg >= 35) return 13.0; // Compact sedans
  if (mpg >= 30) return 14.5; // Mid-size sedans
  if (mpg >= 25) return 16.0; // Large sedans / small SUVs
  if (mpg >= 20) return 18.0; // Mid-size SUVs
  if (mpg >= 15) return 21.0; // Large SUVs / small trucks
  return 23.0; // Large trucks / performance vehicles
}

/**
 * Get tank size with all fallback strategies
 * This is the main function to use
 */
export function getTankSize(spec: VehicleSpec): VehicleSpec {
  if (spec.tankSize && spec.tankSize > 0) {
    // Already has tank size (from API or manual entry)
    return spec;
  }

  const { tankSize, source } = estimateTankSize(spec);

  return {
    ...spec,
    tankSize,
    tankSizeSource: source,
  };
}
