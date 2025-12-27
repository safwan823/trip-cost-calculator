// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';

interface RouteInputProps {
  onSubmit: (origin: string, destination: string) => void;
}

export default function RouteInput({ onSubmit }: RouteInputProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteInit = useRef(false);

  useEffect(() => {
    if (autocompleteInit.current) return;

    const initAutocomplete = () => {
      if (!window.google?.maps?.places?.Autocomplete) {
        setTimeout(initAutocomplete, 200);
        return;
      }

      if (autocompleteInit.current) return;

      try {
        if (originInputRef.current) {
          const originAC = new window.google.maps.places.Autocomplete(originInputRef.current, {
            fields: ['formatted_address', 'name'],
          });
          originAC.addListener('place_changed', () => {
            const place = originAC.getPlace();
            if (place?.formatted_address) {
              setOrigin(place.formatted_address);
            } else if (place?.name) {
              setOrigin(place.name);
            }
          });
        }

        if (destinationInputRef.current) {
          const destAC = new window.google.maps.places.Autocomplete(destinationInputRef.current, {
            fields: ['formatted_address', 'name'],
          });
          destAC.addListener('place_changed', () => {
            const place = destAC.getPlace();
            if (place?.formatted_address) {
              setDestination(place.formatted_address);
            } else if (place?.name) {
              setDestination(place.name);
            }
          });
        }

        autocompleteInit.current = true;
        console.log('✓ Autocomplete ready');
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
    };

    initAutocomplete();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin.trim() || !destination.trim()) {
      alert('Please enter both starting location and destination');
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
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Start typing... (e.g., New York, NY)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Type for autocomplete suggestions or enter manually
        </p>
      </div>

      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
          Destination
        </label>
        <input
          ref={destinationInputRef}
          type="text"
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Start typing... (e.g., Boston, MA)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Type for autocomplete suggestions or enter manually
        </p>
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
