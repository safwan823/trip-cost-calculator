import { RouteInfo, VehicleInfo, FuelPrice, TripCost } from '@/types';

/**
 * Converts meters to miles
 */
export function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

/**
 * Converts meters to kilometers
 */
export function metersToKm(meters: number): number {
  return meters / 1000;
}

/**
 * Formats seconds into human-readable duration
 * Example: 3665 seconds → "1 hour 1 minute"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Calculates fuel needed and total cost for a trip
 */
export function calculateTripCost(
  routeInfo: RouteInfo,
  vehicleInfo: VehicleInfo,
  fuelPrice: FuelPrice
): TripCost {
  let fuelNeeded: number;

  if (vehicleInfo.unit === 'mpg') {
    // Calculate gallons needed (distance in miles / MPG)
    fuelNeeded = routeInfo.distanceMiles / vehicleInfo.fuelEfficiency;
  } else {
    // L/100km: (distance in km / 100) * L/100km
    fuelNeeded = (routeInfo.distanceKm / 100) * vehicleInfo.fuelEfficiency;
  }

  const totalCost = fuelNeeded * fuelPrice.price;
  const costPerMile = totalCost / routeInfo.distanceMiles;

  return {
    routeInfo,
    fuelNeeded: Math.round(fuelNeeded * 100) / 100, // Round to 2 decimals
    totalCost: Math.round(totalCost * 100) / 100,
    costPerMile: Math.round(costPerMile * 100) / 100,
  };
}
