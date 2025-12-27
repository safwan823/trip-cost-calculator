import { RouteInfo, VehicleInfo, RefuelPoint } from '@/types';

/**
 * Calculate optimal refuel points along a route based on vehicle range and safety buffer
 *
 * @param routeInfo - Route information with total distance and optional legs
 * @param vehicleInfo - Vehicle specs including MPG and tank size
 * @param safetyBuffer - Safety margin (0.75 = refuel at 75% of max range, 25% buffer)
 * @returns Array of refuel points with cumulative distances
 */
export function calculateRefuelPlan(
  routeInfo: RouteInfo,
  vehicleInfo: VehicleInfo,
  safetyBuffer: number = 0.75 // Default: refuel at 75% of range (25% safety margin)
): RefuelPoint[] {
  // Calculate vehicle range
  const mpg = vehicleInfo.fuelEfficiency;
  const tankSize = vehicleInfo.tankSize || 15; // Default 15 gallons if not specified
  const maxRange = mpg * tankSize; // Maximum range in miles
  const safeRange = maxRange * safetyBuffer; // Safe range before refueling

  console.log('[RefuelPlanner] Vehicle range:', {
    mpg,
    tankSize,
    maxRange: maxRange.toFixed(1),
    safeRange: safeRange.toFixed(1),
    totalDistance: routeInfo.distanceMiles.toFixed(1),
  });

  const refuelPoints: RefuelPoint[] = [];

  // Add initial point (start with full tank)
  refuelPoints.push({
    cumulativeDistance: 0,
    segmentIndex: 0,
    percentOfTrip: 0,
    reason: 'initial',
  });

  // If trip is shorter than safe range, no refuel needed
  if (routeInfo.distanceMiles <= safeRange) {
    console.log('[RefuelPlanner] Trip shorter than safe range, no refuel needed');

    // Just add final point
    refuelPoints.push({
      cumulativeDistance: routeInfo.distanceMiles,
      segmentIndex: routeInfo.legs?.length || 0,
      percentOfTrip: 100,
      reason: 'final',
    });

    return refuelPoints;
  }

  // Calculate refuel points based on route legs (if available)
  if (routeInfo.legs && routeInfo.legs.length > 0) {
    let cumulativeDistance = 0;
    let lastRefuel = 0; // Distance at last refuel

    for (let i = 0; i < routeInfo.legs.length; i++) {
      const leg = routeInfo.legs[i];
      cumulativeDistance += leg.distanceMiles;

      // Check if we need to refuel
      const distanceSinceLastRefuel = cumulativeDistance - lastRefuel;

      if (distanceSinceLastRefuel >= safeRange) {
        // Need to refuel at or before this point
        refuelPoints.push({
          cumulativeDistance,
          segmentIndex: i,
          percentOfTrip: (cumulativeDistance / routeInfo.distanceMiles) * 100,
          reason: 'range_limit',
        });

        lastRefuel = cumulativeDistance;
        console.log(
          `[RefuelPlanner] Refuel point at ${cumulativeDistance.toFixed(1)} mi (leg ${i})`
        );
      }
    }

    // Check if we need another refuel between last refuel and destination
    const remainingDistance = routeInfo.distanceMiles - lastRefuel;
    if (remainingDistance > safeRange) {
      // Add intermediate refuel point(s)
      let currentDistance = lastRefuel;
      while (routeInfo.distanceMiles - currentDistance > safeRange) {
        currentDistance += safeRange;

        // Find which segment this falls into
        let segmentIndex = 0;
        let accumulatedDistance = 0;
        for (let i = 0; i < routeInfo.legs.length; i++) {
          accumulatedDistance += routeInfo.legs[i].distanceMiles;
          if (accumulatedDistance >= currentDistance) {
            segmentIndex = i;
            break;
          }
        }

        refuelPoints.push({
          cumulativeDistance: currentDistance,
          segmentIndex,
          percentOfTrip: (currentDistance / routeInfo.distanceMiles) * 100,
          reason: 'range_limit',
        });

        console.log(
          `[RefuelPlanner] Additional refuel point at ${currentDistance.toFixed(1)} mi`
        );
      }
    }
  } else {
    // Fallback: No legs data available, evenly space refuel points
    console.log('[RefuelPlanner] No legs data, using evenly spaced refuel points');

    let currentDistance = safeRange;
    while (currentDistance < routeInfo.distanceMiles) {
      refuelPoints.push({
        cumulativeDistance: currentDistance,
        segmentIndex: -1, // Unknown segment
        percentOfTrip: (currentDistance / routeInfo.distanceMiles) * 100,
        reason: 'range_limit',
      });

      console.log(`[RefuelPlanner] Refuel point at ${currentDistance.toFixed(1)} mi`);
      currentDistance += safeRange;
    }
  }

  // Add final point (destination)
  refuelPoints.push({
    cumulativeDistance: routeInfo.distanceMiles,
    segmentIndex: routeInfo.legs?.length || 0,
    percentOfTrip: 100,
    reason: 'final',
  });

  console.log(`[RefuelPlanner] Total refuel plan: ${refuelPoints.length} points`);

  return refuelPoints;
}

/**
 * Get only the refuel stops (excludes initial and final points)
 */
export function getRefuelStopsOnly(refuelPoints: RefuelPoint[]): RefuelPoint[] {
  return refuelPoints.filter((point) => point.reason === 'range_limit');
}

/**
 * Calculate location coordinates for a refuel point based on route legs
 * Interpolates position along the route based on cumulative distance
 */
export function interpolateRefuelLocation(
  refuelPoint: RefuelPoint,
  routeInfo: RouteInfo
): { lat: number; lng: number } | null {
  // This is a simplified version - in reality, you'd need to decode
  // the polyline and find the exact lat/lng at the given distance
  // For now, we'll return null and rely on gas station search radius

  // TODO: Implement polyline interpolation if precise coordinates are needed
  return null;
}

/**
 * Calculate estimated fuel needed for each segment
 * Useful for displaying fuel consumption breakdown
 */
export function calculateFuelPerSegment(
  refuelPoints: RefuelPoint[],
  vehicleInfo: VehicleInfo
): number[] {
  const fuelPerMile = 1 / vehicleInfo.fuelEfficiency; // Gallons per mile

  const fuelSegments: number[] = [];

  for (let i = 1; i < refuelPoints.length; i++) {
    const prevPoint = refuelPoints[i - 1];
    const currentPoint = refuelPoints[i];
    const segmentDistance = currentPoint.cumulativeDistance - prevPoint.cumulativeDistance;
    const fuelNeeded = segmentDistance * fuelPerMile;

    fuelSegments.push(fuelNeeded);
  }

  return fuelSegments;
}
