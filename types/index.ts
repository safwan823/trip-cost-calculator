// Route leg information (segment between two points)
export interface RouteLeg {
  startAddress: string;
  endAddress: string;
  distance: number;          // Meters
  distanceMiles: number;
  duration: number;          // Seconds
  polyline?: string;         // Encoded polyline for this leg
}

// Route information from Google Maps
export interface RouteInfo {
  distance: number;        // Distance in meters
  duration: number;        // Duration in seconds
  distanceMiles: number;   // Distance in miles
  distanceKm: number;      // Distance in kilometers
  durationFormatted: string; // Human-readable duration
  legs?: RouteLeg[];       // NEW: Segment-by-segment data
  origin?: string;         // Origin address
  destination?: string;    // Destination address
  waypoints?: string[];    // Waypoint addresses
}

// Vehicle specification from FuelEconomy.gov API
export interface VehicleSpec {
  year: number;
  make: string;
  model: string;
  option?: string;           // Trim/variant (e.g., "2WD", "AWD")
  vehicleId: number;         // FuelEconomy.gov vehicle ID
  fuelType: 'regular' | 'premium' | 'diesel';
  cityMpg: number;
  highwayMpg: number;
  combinedMpg: number;
  tankSize?: number;         // Gallons (may be missing)
  tankSizeSource?: 'api' | 'static' | 'manual' | 'default';
}

// Dropdown cascade data for vehicle selection
export interface VehicleDropdownData {
  years?: number[];
  makes?: string[];
  models?: string[];
  options?: Array<{ id: number; description: string }>;
}

// Vehicle information for calculations
export interface VehicleInfo {
  spec?: VehicleSpec;        // NEW: Full vehicle spec
  fuelEfficiency: number;  // MPG or L/100km
  unit: 'mpg' | 'l100km';  // Unit type
  tankSize?: number;         // NEW: Tank capacity
  estimatedRange?: number;   // NEW: Calculated range (MPG × tank size)
}

// Fuel pricing
export interface FuelPrice {
  price: number;           // Price per gallon or liter
  currency: 'usd' | 'cad'; // Currency type
  grade?: 'regular' | 'premium' | 'diesel';  // NEW: Fuel grade
}

// Refuel point along route
export interface RefuelPoint {
  cumulativeDistance: number;  // Miles from origin
  segmentIndex: number;        // Which leg this falls on
  percentOfTrip: number;       // 0-100%
  reason: 'initial' | 'range_limit' | 'final';
  location?: { lat: number; lng: number };  // Optional coordinates
}

// Complete trip cost result
export interface TripCost {
  routeInfo: RouteInfo;
  vehicleInfo?: VehicleInfo;   // NEW: Include vehicle info
  fuelNeeded: number;      // Gallons or liters needed
  totalCost: number;       // Total fuel cost
  costPerMile?: number;    // Optional: cost per mile/km

  // NEW: Refuel plan
  refuelPlan?: {
    refuelPoints: RefuelPoint[];
    recommendedStations: GasStation[];
    totalStops: number;
    safetyBuffer: number;    // Percentage (20-25%)
  };
}

// Form state for user inputs
export interface TripInputs {
  origin: string;
  destination: string;
  vehicleInfo: VehicleInfo;
  fuelPrice: FuelPrice;
}

// Gas station information
export interface GasStation {
  name: string;
  address: string;
  location: { lat: number; lng: number };
  city: string;

  // Multi-grade pricing (NEW)
  prices?: {
    regular?: number;
    premium?: number;
    diesel?: number;
  };

  // Legacy single price support (deprecated)
  price?: number;
  priceLevel?: number;      // 1-4 rating (1 = cheapest, 4 = most expensive)
  distance?: number;        // Distance from route in meters
  lastUpdated?: string;     // ISO timestamp of price update
  priceSource?: 'gasbuddy' | 'regional_average' | 'manual'; // Data source
  fuelGrade?: 'regular' | 'premium' | 'diesel'; // Fuel type (deprecated, use prices)

  // NEW: Association with refuel point
  refuelPointIndex?: number;
  isRecommended?: boolean;
}
