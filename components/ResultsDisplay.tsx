'use client';

import { TripCost } from '@/types';

interface ResultsDisplayProps {
  tripCost: TripCost | null;
}

export default function ResultsDisplay({ tripCost }: ResultsDisplayProps) {
  if (!tripCost) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center text-gray-500">
        Select vehicle and calculate route to see cost estimates
      </div>
    );
  }

  const vehicleInfo = tripCost.vehicleInfo;
  const vehicleRange = vehicleInfo?.estimatedRange || 0;

  return (
    <div className="space-y-6">
      {/* Vehicle Info Summary */}
      {vehicleInfo?.spec && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Vehicle Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-600 block text-xs">Vehicle</span>
              <span className="font-medium text-gray-900">
                {vehicleInfo.spec.year} {vehicleInfo.spec.make} {vehicleInfo.spec.model}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-600 block text-xs">Fuel Type</span>
              <span className="font-medium text-gray-900 capitalize">
                {vehicleInfo.spec.fuelType}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-600 block text-xs">Highway MPG</span>
              <span className="font-medium text-gray-900">{vehicleInfo.spec.highwayMpg}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-gray-600 block text-xs">Estimated Range</span>
              <span className="font-medium text-gray-900">{vehicleRange.toFixed(0)} mi</span>
            </div>
          </div>
        </div>
      )}

      {/* Trip Cost Estimate */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 p-6 rounded-lg shadow-lg text-white">
        <h2 className="text-2xl font-bold mb-4">Trip Cost Estimate</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white bg-opacity-20 p-4 rounded-lg">
          <p className="text-sm opacity-90">Distance</p>
          <p className="text-2xl font-bold">
            {tripCost.routeInfo.distanceMiles.toFixed(1)} miles
          </p>
          <p className="text-xs opacity-75">
            ({tripCost.routeInfo.distanceKm.toFixed(1)} km)
          </p>
        </div>

        <div className="bg-white bg-opacity-20 p-4 rounded-lg">
          <p className="text-sm opacity-90">Duration</p>
          <p className="text-2xl font-bold">
            {tripCost.routeInfo.durationFormatted}
          </p>
        </div>

        <div className="bg-white bg-opacity-20 p-4 rounded-lg">
          <p className="text-sm opacity-90">Fuel Needed</p>
          <p className="text-2xl font-bold">
            {tripCost.fuelNeeded.toFixed(2)}
          </p>
          <p className="text-xs opacity-75">gallons/liters</p>
        </div>

        <div className="bg-white bg-opacity-20 p-4 rounded-lg">
          <p className="text-sm opacity-90">Total Cost</p>
          <p className="text-3xl font-bold">
            ${tripCost.totalCost.toFixed(2)}
          </p>
        </div>
      </div>

      {tripCost.costPerMile && (
        <div className="bg-white bg-opacity-20 p-4 rounded-lg text-center">
          <p className="text-sm opacity-90">Cost Per Mile</p>
          <p className="text-xl font-bold">
            ${tripCost.costPerMile.toFixed(3)}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
