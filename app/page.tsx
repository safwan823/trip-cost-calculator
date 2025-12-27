'use client';

import { useState, useCallback, useEffect } from 'react';
import MapDisplay from '@/components/MapDisplay';
import RouteInput from '@/components/RouteInput';
import ResultsDisplay from '@/components/ResultsDisplay';
import VehicleSelector from '@/components/VehicleSelector';
import { RouteInfo, VehicleInfo, TripCost, VehicleSpec } from '@/types';
import { calculateTripCost } from '@/utils/calculations';

type PageStep = 'vehicle' | 'route' | 'results';

export default function Home() {
  // Page navigation state
  const [currentStep, setCurrentStep] = useState<PageStep>('vehicle');

  // Vehicle state
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
    setCurrentStep('route');
    console.log('[Main] Vehicle selected:', spec);
  };

  const handleRouteSubmit = (newOrigin: string, newDestination: string, newWaypoints: string[]) => {
    setOrigin(newOrigin);
    setDestination(newDestination);
    setWaypoints(newWaypoints);
    setTripCost(null);
  };

  const handleRouteCalculated = useCallback((newRouteInfo: RouteInfo) => {
    setRouteInfo(newRouteInfo);
  }, []);

  // Auto-calculate cost when route is calculated
  useEffect(() => {
    if (routeInfo && vehicleSpec && origin && destination) {
      const performCalculation = async () => {
        try {
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

            const vehicleInfo: VehicleInfo = {
              spec: vehicleSpec,
              fuelEfficiency: vehicleSpec.highwayMpg,
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
            setCurrentStep('results');
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
    <main className="min-h-screen flex flex-col bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <header className="bg-[#121212] border-b border-[#FFC107]/20 px-6 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#FFC107] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">FuelTrip</h1>
              <p className="text-xs text-gray-400">Calculate trip costs</p>
            </div>
          </div>
          {currentStep !== 'vehicle' && (
            <button
              onClick={() => {
                if (currentStep === 'route') setCurrentStep('vehicle');
                if (currentStep === 'results') setCurrentStep('route');
              }}
              className="text-[#FFC107] hover:text-[#FFD54F] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-[#121212] border-b border-[#FFC107]/10 px-6 py-3">
        <div className="flex items-center justify-center space-x-2 max-w-md mx-auto">
          <div className={`flex items-center ${currentStep === 'vehicle' || vehicleSpec ? 'text-[#FFC107]' : 'text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${currentStep === 'vehicle' || vehicleSpec ? 'bg-[#FFC107] text-[#121212]' : 'bg-gray-800 text-gray-600'}`}>
              {vehicleSpec ? '✓' : '1'}
            </div>
          </div>
          <div className={`flex-1 h-1 rounded ${vehicleSpec ? 'bg-[#FFC107]' : 'bg-gray-800'}`}></div>
          <div className={`flex items-center ${currentStep === 'route' || (origin && destination) ? 'text-[#FFC107]' : 'text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${currentStep === 'route' || (origin && destination) ? 'bg-[#FFC107] text-[#121212]' : 'bg-gray-800 text-gray-600'}`}>
              {origin && destination ? '✓' : '2'}
            </div>
          </div>
          <div className={`flex-1 h-1 rounded ${tripCost ? 'bg-[#FFC107]' : 'bg-gray-800'}`}></div>
          <div className={`flex items-center ${currentStep === 'results' || tripCost ? 'text-[#FFC107]' : 'text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${currentStep === 'results' || tripCost ? 'bg-[#FFC107] text-[#121212]' : 'bg-gray-800 text-gray-600'}`}>
              {tripCost ? '✓' : '3'}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Full Height Pages */}
      <div className="flex-1 overflow-hidden">
        {/* Page 1: Vehicle Selection */}
        {currentStep === 'vehicle' && (
          <div className="h-full flex flex-col justify-center px-6 py-8 max-w-md mx-auto">
            <VehicleSelector onVehicleSelect={handleVehicleSelect} disabled={false} />
          </div>
        )}

        {/* Page 2: Route Input */}
        {currentStep === 'route' && (
          <div className="h-full flex flex-col px-6 py-8 max-w-md mx-auto">
            <RouteInput onSubmit={handleRouteSubmit} />
            {origin && destination && (
              <div className="mt-6 flex-1 bg-[#2a2a2a] rounded-2xl overflow-hidden border border-[#FFC107]/20">
                <MapDisplay
                  origin={origin}
                  destination={destination}
                  waypoints={waypoints}
                  onRouteCalculated={handleRouteCalculated}
                />
              </div>
            )}
          </div>
        )}

        {/* Page 3: Results */}
        {currentStep === 'results' && tripCost && (
          <div className="h-full overflow-y-auto px-6 py-8 max-w-md mx-auto">
            <ResultsDisplay tripCost={tripCost} />
            <button
              onClick={() => {
                setCurrentStep('vehicle');
                setVehicleSpec(null);
                setOrigin('');
                setDestination('');
                setWaypoints([]);
                setRouteInfo(null);
                setTripCost(null);
              }}
              className="w-full mt-6 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 px-6 rounded-xl font-semibold transition-all border border-[#FFC107]/20"
            >
              Calculate New Trip
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
