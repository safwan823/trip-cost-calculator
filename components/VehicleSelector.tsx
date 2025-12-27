'use client';

import { useState, useEffect } from 'react';
import { VehicleSpec } from '@/types';
import { getTankSize } from '@/utils/tankCapacity';

interface VehicleSelectorProps {
  onVehicleSelect: (spec: VehicleSpec) => void;
  disabled?: boolean;
}

export default function VehicleSelector({ onVehicleSelect, disabled = false }: VehicleSelectorProps) {
  const [step, setStep] = useState<'year' | 'make' | 'model' | 'review'>('year');

  const [years, setYears] = useState<number[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const [vehicleSpec, setVehicleSpec] = useState<VehicleSpec | null>(null);
  const [tankSize, setTankSize] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch years on mount
  useEffect(() => {
    fetchYears();
  }, []);

  async function fetchYears() {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/vehicle-specs?action=years');
      if (!res.ok) throw new Error('Failed to fetch years');
      const data = await res.json();
      setYears(data.years || []);
    } catch (err) {
      setError('Failed to load years. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleYearSelect(year: number) {
    try {
      setSelectedYear(year);
      setLoading(true);
      setError('');
      const res = await fetch(`/api/vehicle-specs?action=makes&year=${year}`);
      if (!res.ok) throw new Error('Failed to fetch makes');
      const data = await res.json();
      setMakes(data.makes || []);
      setStep('make');
    } catch (err) {
      setError('Failed to load makes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMakeSelect(make: string) {
    try {
      setSelectedMake(make);
      setLoading(true);
      setError('');
      const res = await fetch(
        `/api/vehicle-specs?action=models&year=${selectedYear}&make=${encodeURIComponent(make)}`
      );
      if (!res.ok) throw new Error('Failed to fetch models');
      const data = await res.json();
      setModels(data.models || []);
      setStep('model');
    } catch (err) {
      setError('Failed to load models. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleModelSelect(model: string) {
    try {
      setSelectedModel(model);
      setLoading(true);
      setError('');
      const res = await fetch(
        `/api/vehicle-specs?action=options&year=${selectedYear}&make=${encodeURIComponent(
          selectedMake
        )}&model=${encodeURIComponent(model)}`
      );
      if (!res.ok) throw new Error('Failed to fetch options');
      const data = await res.json();
      const options = data.options || [];

      if (options.length === 0) {
        setError('No vehicle data found for this model.');
        setLoading(false);
        return;
      }

      // Automatically select the first option (we just need MPG data, trim doesn't matter)
      const firstOption = options[0];
      await handleOptionSelect(firstOption.id);
    } catch (err) {
      setError('Failed to load vehicle data. Please try again.');
      console.error(err);
      setLoading(false);
    }
  }

  async function handleOptionSelect(optionId: number) {
    try {
      setLoading(true);
      setError('');

      // Fetch vehicle details
      const res = await fetch(`/api/vehicle-specs?action=details&vehicleId=${optionId}`);
      if (!res.ok) throw new Error('Failed to fetch vehicle details');
      const spec: VehicleSpec = await res.json();

      // Estimate tank size using our utility
      const specWithTank = getTankSize(spec);
      setVehicleSpec(specWithTank);
      setTankSize(specWithTank.tankSize || 15);

      setStep('review');
    } catch (err) {
      setError('Failed to load vehicle details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (vehicleSpec) {
      const finalSpec = { ...vehicleSpec, tankSize };
      onVehicleSelect(finalSpec);
    }
  }

  function handleEditYear() {
    setStep('year');
    setSelectedMake('');
    setSelectedModel('');
    setVehicleSpec(null);
    setMakes([]);
    setModels([]);
  }

  function handleEditMake() {
    setStep('make');
    setSelectedModel('');
    setVehicleSpec(null);
    setModels([]);
  }

  function handleEditModel() {
    setStep('model');
    setVehicleSpec(null);
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Step 1: Select Your Vehicle</h2>
      </div>

      {/* Breadcrumb navigation - show selected values with edit buttons */}
      {(selectedYear || selectedMake || selectedModel) && (
        <div className="flex flex-wrap gap-2 text-sm">
          {selectedYear && (
            <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-gray-700">Year: <span className="font-medium">{selectedYear}</span></span>
              <button
                onClick={handleEditYear}
                className="ml-1 text-blue-600 hover:text-blue-800"
                disabled={disabled}
                title="Change year"
              >
                ✏️
              </button>
            </div>
          )}
          {selectedMake && (
            <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-gray-700">Make: <span className="font-medium">{selectedMake}</span></span>
              <button
                onClick={handleEditMake}
                className="ml-1 text-blue-600 hover:text-blue-800"
                disabled={disabled}
                title="Change make"
              >
                ✏️
              </button>
            </div>
          )}
          {selectedModel && (
            <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-gray-700">Model: <span className="font-medium">{selectedModel}</span></span>
              <button
                onClick={handleEditModel}
                className="ml-1 text-blue-600 hover:text-blue-800"
                disabled={disabled}
                title="Change model"
              >
                ✏️
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Step 1: Year */}
          {step === 'year' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => handleYearSelect(Number(e.target.value))}
                disabled={disabled}
                defaultValue=""
              >
                <option value="" disabled>
                  Select Year...
                </option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 2: Make */}
          {step === 'make' && selectedYear && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Year:</span> {selectedYear}
              </p>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Make</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => handleMakeSelect(e.target.value)}
                  disabled={disabled}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Make...
                  </option>
                  {makes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Model */}
          {step === 'model' && selectedMake && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Year:</span> {selectedYear} |{' '}
                <span className="font-medium">Make:</span> {selectedMake}
              </p>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => handleModelSelect(e.target.value)}
                  disabled={disabled}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select Model...
                  </option>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && vehicleSpec && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="mb-3">
                  <h3 className="font-semibold text-blue-900 text-lg">
                    {vehicleSpec.year} {vehicleSpec.make} {vehicleSpec.model}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-3 rounded">
                    <span className="text-gray-600 block text-xs">Fuel Type</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {vehicleSpec.fuelType}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded">
                    <span className="text-gray-600 block text-xs">Combined MPG</span>
                    <span className="font-medium text-gray-900">{vehicleSpec.combinedMpg}</span>
                  </div>

                  <div className="bg-white p-3 rounded">
                    <span className="text-gray-600 block text-xs">Highway MPG</span>
                    <span className="font-medium text-gray-900">{vehicleSpec.highwayMpg}</span>
                  </div>

                  <div className="bg-white p-3 rounded">
                    <span className="text-gray-600 block text-xs">City MPG</span>
                    <span className="font-medium text-gray-900">{vehicleSpec.cityMpg}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tank Size (gallons)
                    {vehicleSpec.tankSizeSource && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({vehicleSpec.tankSizeSource === 'static' ? 'from database' : 'estimated'})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={tankSize}
                    onChange={(e) => setTankSize(Number(e.target.value))}
                    min="1"
                    max="50"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={disabled}
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Estimated Range:{' '}
                    <span className="font-semibold text-blue-700">
                      {(vehicleSpec.combinedMpg * tankSize).toFixed(0)} miles
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={disabled}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Confirm Vehicle Selection
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
