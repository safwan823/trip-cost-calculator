'use client';

import { useState, useEffect } from 'react';
import { GasStation } from '@/types';

interface GasStationSelectorProps {
  route: { origin: string; destination: string; waypoints: string[] } | null;
  onStationSelect: (station: GasStation | null) => void;
}

export default function GasStationSelector({ route, onStationSelect }: GasStationSelectorProps) {
  const [gasStations, setGasStations] = useState<GasStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [loading, setLoading] = useState(false);
  const [customPrices, setCustomPrices] = useState<{ [key: string]: string }>({});

  // Fetch gas stations when route changes
  useEffect(() => {
    if (!route) return;

    const fetchGasStations = async () => {
      setLoading(true);
      try {
        // For now, we'll geocode the locations to get lat/lng
        // In a real app, you'd get these from the route calculation
        const locations = [
          { address: route.origin, city: route.origin.split(',')[0] },
          ...route.waypoints.map(w => ({ address: w, city: w.split(',')[0] })),
          { address: route.destination, city: route.destination.split(',')[0] },
        ];

        // Geocode each location
        const geocodedLocations = await Promise.all(
          locations.map(async (loc) => {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                loc.address
              )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
              return {
                lat: data.results[0].geometry.location.lat,
                lng: data.results[0].geometry.location.lng,
                city: loc.city,
              };
            }
            return null;
          })
        );

        const validLocations = geocodedLocations.filter(loc => loc !== null);

        // Fetch gas stations near these locations
        const response = await fetch('/api/gas-stations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locations: validLocations }),
        });

        const data = await response.json();
        if (data.gasStations) {
          setGasStations(data.gasStations);
        }
      } catch (error) {
        console.error('Error fetching gas stations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGasStations();
  }, [route]);

  const handleStationSelect = (station: GasStation) => {
    setSelectedStation(station);
    const price = customPrices[station.address]
      ? parseFloat(customPrices[station.address])
      : undefined;
    onStationSelect({ ...station, price });
  };

  const handlePriceChange = (stationAddress: string, price: string) => {
    setCustomPrices({ ...customPrices, [stationAddress]: price });
    if (selectedStation && selectedStation.address === stationAddress) {
      onStationSelect({ ...selectedStation, price: parseFloat(price) || undefined });
    }
  };

  const getPriceLevelLabel = (level: number) => {
    switch (level) {
      case 1: return '$ (Cheapest)';
      case 2: return '$$ (Moderate)';
      case 3: return '$$$ (Expensive)';
      case 4: return '$$$$ (Very Expensive)';
      default: return 'Unknown';
    }
  };

  const getPriceLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-600 bg-green-50 border-green-200';
      case 2: return 'text-blue-600 bg-blue-50 border-blue-200';
      case 3: return 'text-orange-600 bg-orange-50 border-orange-200';
      case 4: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!route) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Gas Stations Along Route</h3>
        <p className="text-gray-500 text-sm">Calculate a route first to see gas stations</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Gas Stations Along Route
      </h3>

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Finding gas stations...</p>
        </div>
      ) : gasStations.length === 0 ? (
        <p className="text-gray-500 text-sm">No gas stations found along this route</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {gasStations.map((station, index) => (
            <div
              key={index}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedStation?.address === station.address
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleStationSelect(station)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{station.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{station.address}</p>
                  {station.city && (
                    <p className="text-xs text-gray-500 mt-1">Near: {station.city}</p>
                  )}
                </div>
                {station.priceLevel && (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${getPriceLevelColor(
                      station.priceLevel
                    )}`}
                  >
                    {getPriceLevelLabel(station.priceLevel)}
                  </span>
                )}
              </div>

              {/* Display real-time GasBuddy price if available */}
              {station.price ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-600">
                      ${station.price.toFixed(2)}/gal
                    </span>
                    {station.priceSource === 'regional_average' && (
                      <span className="text-xs text-orange-500 font-medium">
                        (Regional Avg)
                      </span>
                    )}
                  </div>
                  {station.lastUpdated && (
                    <p className="text-xs text-gray-500">
                      Updated: {new Date(station.lastUpdated).toLocaleString()}
                    </p>
                  )}
                  <div className="pt-2 border-t border-gray-200">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Override Price (optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={`Current: $${station.price.toFixed(2)}`}
                      value={customPrices[station.address] || ''}
                      onChange={(e) => {
                        e.stopPropagation();
                        handlePriceChange(station.address, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Enter Gas Price ($/gallon)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 3.45"
                    value={customPrices[station.address] || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      handlePriceChange(station.address, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {selectedStation?.address === station.address && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                  ✓ Selected for cost calculation
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedStation && (
        <button
          onClick={() => {
            setSelectedStation(null);
            onStationSelect(null);
          }}
          className="mt-4 w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          Clear Selection (Use Manual Price)
        </button>
      )}
    </div>
  );
}
