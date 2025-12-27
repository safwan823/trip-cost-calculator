// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';

interface RouteInputProps {
  onSubmit: (origin: string, destination: string) => void;
}

export default function RouteInput({ onSubmit }: RouteInputProps) {
  const [originSelected, setOriginSelected] = useState('');
  const [destinationSelected, setDestinationSelected] = useState('');
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (initialized.current) return;

    const initAutocomplete = () => {
      // Wait for Google Maps to load
      if (!window.google?.maps?.places?.Autocomplete) {
        setTimeout(initAutocomplete, 100);
        return;
      }

      if (initialized.current) return;

      try {
        // Initialize origin autocomplete
        if (originInputRef.current) {
          const originAutocomplete = new window.google.maps.places.Autocomplete(
            originInputRef.current,
            {
              fields: ['formatted_address', 'name'],
              types: ['geocode'],
            }
          );

          originAutocomplete.addListener('place_changed', () => {
            const place = originAutocomplete.getPlace();
            if (place?.formatted_address || place?.name) {
              const address = place.formatted_address || place.name;
              console.log('Origin selected:', address);
              setOriginSelected(address);
            }
          });
        }

        // Initialize destination autocomplete
        if (destinationInputRef.current) {
          const destinationAutocomplete = new window.google.maps.places.Autocomplete(
            destinationInputRef.current,
            {
              fields: ['formatted_address', 'name'],
              types: ['geocode'],
            }
          );

          destinationAutocomplete.addListener('place_changed', () => {
            const place = destinationAutocomplete.getPlace();
            if (place?.formatted_address || place?.name) {
              const address = place.formatted_address || place.name;
              console.log('Destination selected:', address);
              setDestinationSelected(address);
            }
          });
        }

        initialized.current = true;
        console.log('✓ Google Places Autocomplete initialized - start typing to see dropdown');
      } catch (error) {
        console.error('Autocomplete error:', error);
      }
    };

    initAutocomplete();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const origin = originInputRef.current?.value || '';
    const destination = destinationInputRef.current?.value || '';

    if (!origin.trim() || !destination.trim()) {
      alert('Please select both origin and destination from the dropdown');
      return;
    }

    onSubmit(origin, destination);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <div>
        <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
          Starting Location
        </label>
        <input
          ref={originInputRef}
          type="text"
          id="origin"
          placeholder="Type to search... (e.g., New York, NY)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {originSelected && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Selected: {originSelected}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
          Destination
        </label>
        <input
          ref={destinationInputRef}
          type="text"
          id="destination"
          placeholder="Type to search... (e.g., Boston, MA)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {destinationSelected && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Selected: {destinationSelected}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Calculate Route
      </button>
    </form>
  );
}
