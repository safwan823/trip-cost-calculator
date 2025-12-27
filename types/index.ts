// Route information from Google Maps
export interface RouteInfo {
  distance: number;        // Distance in meters
  duration: number;        // Duration in seconds
  distanceMiles: number;   // Distance in miles
  distanceKm: number;      // Distance in kilometers
  durationFormatted: string; // Human-readable duration
}

// Vehicle information for calculations
export interface VehicleInfo {
  fuelEfficiency: number;  // MPG or L/100km
  unit: 'mpg' | 'l100km';  // Unit type
}

// Fuel pricing
export interface FuelPrice {
  price: number;           // Price per gallon or liter
  currency: 'usd' | 'cad'; // Currency type
}

// Complete trip cost result
export interface TripCost {
  routeInfo: RouteInfo;
  fuelNeeded: number;      // Gallons or liters needed
  totalCost: number;       // Total fuel cost
  costPerMile?: number;    // Optional: cost per mile/km
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
  price?: number;           // Actual gas price (user can set or from API)
  priceLevel?: number;      // 1-4 rating (1 = cheapest, 4 = most expensive)
  distance?: number;        // Distance from route in meters
  lastUpdated?: string;     // ISO timestamp of price update
  priceSource?: 'gasbuddy' | 'regional_average' | 'manual'; // Data source
  fuelGrade?: 'regular' | 'premium' | 'diesel'; // Fuel type
}
