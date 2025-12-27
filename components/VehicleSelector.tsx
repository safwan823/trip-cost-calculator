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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
        <div className="flex items-center text-white">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          <h2 className="text-base sm:text-lg font-semibold">Select Your Vehicle</h2>
        </div>
      </div>

      <div className="p-4 space-y-4">

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
              <label className="block text-sm font-semibold text-gray-700">Vehicle Year</label>
              <select
                className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 appearance-none cursor-pointer"
                onChange={(e) => handleYearSelect(Number(e.target.value))}
                disabled={disabled}
                defaultValue=""
              >
                <option value="" disabled>
                  Tap to select year...
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
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Vehicle Make</label>
              <select
                className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 appearance-none cursor-pointer"
                onChange={(e) => handleMakeSelect(e.target.value)}
                disabled={disabled}
                defaultValue=""
              >
                <option value="" disabled>
                  Tap to select make...
                </option>
                {makes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 3: Model */}
          {step === 'model' && selectedMake && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Vehicle Model</label>
              <select
                className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 appearance-none cursor-pointer"
                onChange={(e) => handleModelSelect(e.target.value)}
                disabled={disabled}
                defaultValue=""
              >
                <option value="" disabled>
                  Tap to select model...
                </option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && vehicleSpec && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">Vehicle Selected</span>
                  </div>
                  <h3 className="font-bold text-blue-900 text-lg">
                    {vehicleSpec.year} {vehicleSpec.make} {vehicleSpec.model}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-500 block text-xs uppercase tracking-wide">Fuel Type</span>
                    <span className="font-semibold text-gray-900 capitalize text-base">
                      {vehicleSpec.fuelType}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-500 block text-xs uppercase tracking-wide">Combined</span>
                    <span className="font-semibold text-gray-900 text-base">{vehicleSpec.combinedMpg} MPG</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-500 block text-xs uppercase tracking-wide">Highway</span>
                    <span className="font-semibold text-gray-900 text-base">{vehicleSpec.highwayMpg} MPG</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <span className="text-gray-500 block text-xs uppercase tracking-wide">City</span>
                    <span className="font-semibold text-gray-900 text-base">{vehicleSpec.cityMpg} MPG</span>
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
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed active:scale-95"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm Vehicle
                </span>
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
