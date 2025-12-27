'use client';

import { useState } from 'react';
import { VehicleInfo, FuelPrice, GasStation } from '@/types';

interface CostCalculatorProps {
  onCalculate: (vehicleInfo: VehicleInfo, fuelPrice: FuelPrice) => void;
  selectedGasStation?: GasStation | null;
}

export default function CostCalculator({ onCalculate, selectedGasStation }: CostCalculatorProps) {
  const [fuelEfficiency, setFuelEfficiency] = useState('25');
  const [unit, setUnit] = useState<'mpg' | 'l100km'>('mpg');
  const [price, setPrice] = useState('3.50');
  const [currency] = useState<'usd' | 'cad'>('usd');

  // Display the selected gas station price if available, otherwise use manual price
  const displayPrice = selectedGasStation?.price
    ? selectedGasStation.price.toFixed(2)
    : price;

  const handleCalculate = () => {
    const efficiency = parseFloat(fuelEfficiency);
    const fuelPriceNum = parseFloat(displayPrice);

    if (isNaN(efficiency) || efficiency <= 0) {
      alert('Please enter a valid fuel efficiency');
      return;
    }

    if (isNaN(fuelPriceNum) || fuelPriceNum <= 0) {
      alert('Please enter a valid fuel price');
      return;
    }

    onCalculate(
      { fuelEfficiency: efficiency, unit },
      { price: fuelPriceNum, currency }
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Vehicle & Fuel Info</h2>

      <div>
        <label htmlFor="efficiency" className="block text-sm font-medium text-gray-700 mb-2">
          Fuel Efficiency
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            id="efficiency"
            value={fuelEfficiency}
            onChange={(e) => setFuelEfficiency(e.target.value)}
            step="0.1"
            min="0.1"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as 'mpg' | 'l100km')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="mpg">MPG (US)</option>
            <option value="l100km">L/100km</option>
          </select>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {unit === 'mpg'
            ? 'Average car: 25-30 MPG, Hybrid: 40-50 MPG'
            : 'Average car: 8-10 L/100km, Hybrid: 4-6 L/100km'}
        </p>
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
          Fuel Price (${currency === 'usd' ? 'USD' : 'CAD'} per {unit === 'mpg' ? 'gallon' : 'liter'})
        </label>
        <input
          type="number"
          id="price"
          value={displayPrice}
          onChange={(e) => setPrice(e.target.value)}
          step="0.01"
          min="0.01"
          disabled={selectedGasStation?.price !== undefined}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            selectedGasStation?.price !== undefined ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        {selectedGasStation ? (
          <p className="text-xs text-green-600 mt-1 font-medium">
            ✓ Using {selectedGasStation.priceSource === 'gasbuddy'
              ? 'real-time GasBuddy'
              : selectedGasStation.priceSource === 'regional_average'
              ? 'regional average'
              : ''} price from {selectedGasStation.name}
            {selectedGasStation.lastUpdated && (
              <span className="text-gray-500 block">
                (Updated {new Date(selectedGasStation.lastUpdated).toLocaleDateString()})
              </span>
            )}
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            Select a gas station above or enter price manually
          </p>
        )}
      </div>

      <button
        onClick={handleCalculate}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
      >
        Calculate Trip Cost
      </button>
    </div>
  );
}
