'use client';

import { useState } from 'react';

interface RouteInputProps {
  onSubmit: (origin: string, destination: string) => void;
}

export default function RouteInput({ onSubmit }: RouteInputProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin.trim() || !destination.trim()) {
      alert('Please enter both origin and destination');
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
          type="text"
          id="origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Enter city or address"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Example: &quot;New York, NY&quot; or &quot;Los Angeles, CA&quot;
        </p>
      </div>

      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
          Destination
        </label>
        <input
          type="text"
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter city or address"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Example: &quot;Boston, MA&quot; or &quot;Chicago, IL&quot;
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
