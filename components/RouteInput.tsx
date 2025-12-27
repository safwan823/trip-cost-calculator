'use client';

import { useState, useEffect, useRef } from 'react';

interface RouteInputProps {
  onSubmit: (origin: string, destination: string, waypoints: string[]) => void;
}

interface Suggestion {
  description: string;
  placeId: string;
}

export default function RouteInput({ onSubmit }: RouteInputProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [originSuggestions, setOriginSuggestions] = useState<Suggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Suggestion[]>([]);
  const [waypointSuggestions, setWaypointSuggestions] = useState<{[key: number]: Suggestion[]}>({});
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showWaypointDropdown, setShowWaypointDropdown] = useState<{[key: number]: boolean}>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (input: string, setSuggestions: (s: Suggestion[]) => void) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await response.json();

      if (data.predictions) {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Autocomplete fetch error:', error);
      setSuggestions([]);
    }
  };

  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrigin(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length > 2) {
      setShowOriginDropdown(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value, setOriginSuggestions);
      }, 300);
    } else {
      setShowOriginDropdown(false);
      setOriginSuggestions([]);
    }
  };

  const handleDestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestination(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length > 2) {
      setShowDestDropdown(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value, setDestSuggestions);
      }, 300);
    } else {
      setShowDestDropdown(false);
      setDestSuggestions([]);
    }
  };

  const selectOrigin = (description: string) => {
    setOrigin(description);
    setShowOriginDropdown(false);
    setOriginSuggestions([]);
  };

  const selectDestination = (description: string) => {
    setDestination(description);
    setShowDestDropdown(false);
    setDestSuggestions([]);
  };

  const handleWaypointChange = (index: number, value: string) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = value;
    setWaypoints(newWaypoints);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length > 2) {
      setShowWaypointDropdown({ ...showWaypointDropdown, [index]: true });
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value, (suggestions) => {
          setWaypointSuggestions({ ...waypointSuggestions, [index]: suggestions });
        });
      }, 300);
    } else {
      setShowWaypointDropdown({ ...showWaypointDropdown, [index]: false });
      const newSuggestions = { ...waypointSuggestions };
      delete newSuggestions[index];
      setWaypointSuggestions(newSuggestions);
    }
  };

  const selectWaypoint = (index: number, description: string) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = description;
    setWaypoints(newWaypoints);
    setShowWaypointDropdown({ ...showWaypointDropdown, [index]: false });
    const newSuggestions = { ...waypointSuggestions };
    delete newSuggestions[index];
    setWaypointSuggestions(newSuggestions);
  };

  const addWaypoint = () => {
    setWaypoints([...waypoints, '']);
  };

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
    const newSuggestions = { ...waypointSuggestions };
    delete newSuggestions[index];
    setWaypointSuggestions(newSuggestions);
    const newDropdowns = { ...showWaypointDropdown };
    delete newDropdowns[index];
    setShowWaypointDropdown(newDropdowns);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin.trim() || !destination.trim()) {
      alert('Please enter both starting location and destination');
      return;
    }

    onSubmit(origin, destination, waypoints.filter(w => w.trim()));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <div className="relative">
        <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
          Starting Location
        </label>
        <input
          type="text"
          id="origin"
          value={origin}
          onChange={handleOriginChange}
          placeholder="Enter address (e.g., New York, NY)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
        />
        {showOriginDropdown && originSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {originSuggestions.map((suggestion) => (
              <div
                key={suggestion.placeId}
                onClick={() => selectOrigin(suggestion.description)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
              >
                {suggestion.description}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Enter city, address, or landmark
        </p>
      </div>

      {/* Waypoints Section */}
      {waypoints.map((waypoint, index) => (
        <div key={index} className="relative">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={`waypoint-${index}`} className="block text-sm font-medium text-gray-700">
              Stop {index + 1}
            </label>
            <button
              type="button"
              onClick={() => removeWaypoint(index)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
          <input
            type="text"
            id={`waypoint-${index}`}
            value={waypoint}
            onChange={(e) => handleWaypointChange(index, e.target.value)}
            placeholder="Enter address (e.g., Philadelphia, PA)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoComplete="off"
          />
          {showWaypointDropdown[index] && waypointSuggestions[index]?.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {waypointSuggestions[index].map((suggestion) => (
                <div
                  key={suggestion.placeId}
                  onClick={() => selectWaypoint(index, suggestion.description)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                >
                  {suggestion.description}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Add a stop along your route
          </p>
        </div>
      ))}

      {/* Add Stop Button */}
      <button
        type="button"
        onClick={addWaypoint}
        className="bg-green-600 text-white py-1.5 px-3 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Stop
      </button>

      <div className="relative">
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
          Destination
        </label>
        <input
          type="text"
          id="destination"
          value={destination}
          onChange={handleDestChange}
          placeholder="Enter address (e.g., Boston, MA)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
        />
        {showDestDropdown && destSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {destSuggestions.map((suggestion) => (
              <div
                key={suggestion.placeId}
                onClick={() => selectDestination(suggestion.description)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
              >
                {suggestion.description}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Enter city, address, or landmark
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
