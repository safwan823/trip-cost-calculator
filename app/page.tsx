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
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Mobile-First Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Fuel Trip</h1>
              <p className="text-xs sm:text-sm text-blue-100">Calculate your road trip costs</p>
            </div>
            <div className="bg-blue-500 bg-opacity-30 rounded-full p-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Stack Layout */}
      <div className="pb-20">
        {/* Step Indicator */}
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <div className={`flex items-center ${vehicleSpec ? 'text-green-600' : 'text-blue-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${vehicleSpec ? 'bg-green-100' : 'bg-blue-100'} mr-1`}>
                {vehicleSpec ? '✓' : '1'}
              </div>
              <span className="font-medium hidden sm:inline">Vehicle</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center ${origin && destination ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${origin && destination ? 'bg-green-100' : 'bg-gray-100'} mr-1`}>
                {origin && destination ? '✓' : '2'}
              </div>
              <span className="font-medium hidden sm:inline">Route</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center ${tripCost ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tripCost ? 'bg-green-100' : 'bg-gray-100'} mr-1`}>
                {tripCost ? '✓' : '3'}
              </div>
              <span className="font-medium hidden sm:inline">Cost</span>
            </div>
          </div>
        </div>

        {/* Vehicle Selection Section */}
        <div className="px-4 py-4">
          <VehicleSelector
            onVehicleSelect={handleVehicleSelect}
            disabled={false}
          />
        </div>

        {/* Route Input Section */}
        {vehicleSpec && (
          <div className="px-4 py-4 bg-white border-t">
            <RouteInput onSubmit={handleRouteSubmit} />
          </div>
        )}

        {/* Map Section */}
        {origin && destination && (
          <div className="px-4 py-4 bg-gradient-to-b from-gray-50 to-white">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <MapDisplay
                origin={origin}
                destination={destination}
                waypoints={waypoints}
                onRouteCalculated={handleRouteCalculated}
              />
            </div>
          </div>
        )}

        {/* Results Section */}
        {tripCost && (
          <div className="px-4 py-4">
            <ResultsDisplay tripCost={tripCost} />
          </div>
        )}

        {/* Empty State */}
        {!origin && !destination && vehicleSpec && (
          <div className="px-4 py-12 text-center">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-gray-600 font-medium">Ready to calculate your trip!</p>
              <p className="text-sm text-gray-400 mt-2">Enter your route above to get started</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
