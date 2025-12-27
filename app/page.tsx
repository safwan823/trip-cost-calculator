'use client';

import { useState, useCallback, useEffect } from 'react';
import MapDisplay from '@/components/MapDisplay';
import RouteInput from '@/components/RouteInput';
import ResultsDisplay from '@/components/ResultsDisplay';
import VehicleSelector from '@/components/VehicleSelector';
import { RouteInfo, VehicleInfo, TripCost, VehicleSpec } from '@/types';
import { calculateTripCost } from '@/utils/calculations';

export default function Home() {
  // Vehicle state (FIRST)
  const [vehicleSpec, setVehicleSpec] = useState<VehicleSpec | null>(null);

  // Route state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Cost state
  const [averageGasPrice, setAverageGasPrice] = useState<number>(3.50);
  const [tripCost, setTripCost] = useState<TripCost | null>(null);

  const handleVehicleSelect = (spec: VehicleSpec) => {
    setVehicleSpec(spec);
    console.log('[Main] Vehicle selected:', spec);
  };

  const handleRouteSubmit = (newOrigin: string, newDestination: string, newWaypoints: string[]) => {
    setOrigin(newOrigin);
    setDestination(newDestination);
    setWaypoints(newWaypoints);
    setTripCost(null); // Reset cost when route changes
  };

  const handleRouteCalculated = useCallback((newRouteInfo: RouteInfo) => {
    setRouteInfo(newRouteInfo);
  }, []);

  // Auto-calculate cost when route is calculated
  useEffect(() => {
    if (routeInfo && vehicleSpec && origin && destination) {
      const performCalculation = async () => {
        try {
          // Fetch average gas price for cities along route
          const locations = [
            { address: origin },
            ...waypoints.map(w => ({ address: w })),
            { address: destination },
          ];

          const response = await fetch('/api/gas-prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              locations,
              fuelGrade: vehicleSpec.fuelType,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setAverageGasPrice(data.averagePrice);

            // Calculate trip cost
            const vehicleInfo: VehicleInfo = {
              spec: vehicleSpec,
              fuelEfficiency: vehicleSpec.highwayMpg, // Use highway MPG for road trips
              unit: 'mpg',
              tankSize: vehicleSpec.tankSize,
              estimatedRange: vehicleSpec.highwayMpg * (vehicleSpec.tankSize || 15),
            };

            const cost = calculateTripCost(routeInfo, vehicleInfo, {
              price: data.averagePrice,
              currency: 'usd',
              grade: vehicleSpec.fuelType,
            });

            setTripCost({ ...cost, vehicleInfo });
            console.log('[Main] Trip cost calculated:', cost);
          }
        } catch (error) {
          console.error('[Main] Failed to calculate cost:', error);
        }
      };

      performCalculation();
    }
  }, [routeInfo, vehicleSpec, origin, destination, waypoints]);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Trip Cost Calculator</h1>
          <p className="text-blue-100 mt-2">
            Calculate fuel costs for your road trips using real-time route data
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            {/* Step 1: Vehicle Selection (FIRST) */}
            <VehicleSelector
              onVehicleSelect={handleVehicleSelect}
              disabled={false}
            />

            {/* Step 2: Route Input (enabled after vehicle selection) */}
            <div className={!vehicleSpec ? 'opacity-50 pointer-events-none' : ''}>
              {!vehicleSpec && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm">
                  Please select your vehicle first
                </div>
              )}
              <RouteInput onSubmit={handleRouteSubmit} />
            </div>
          </div>

          {/* Right Column - Map and Results */}
          <div className="lg:col-span-2 space-y-6">
            {origin && destination ? (
              <MapDisplay
                origin={origin}
                destination={destination}
                waypoints={waypoints}
                onRouteCalculated={handleRouteCalculated}
              />
            ) : (
              <div className="bg-white p-12 rounded-lg shadow-md text-center text-gray-500">
                <svg
                  className="w-24 h-24 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <p className="text-lg">Enter your route details to get started</p>
              </div>
            )}

            <ResultsDisplay tripCost={tripCost} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Built with Next.js, Google Maps API, and Vercel
          </p>
        </div>
      </footer>
    </main>
  );
}
