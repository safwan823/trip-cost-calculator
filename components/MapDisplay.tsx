// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';
import { RouteInfo } from '@/types';
import { metersToMiles, metersToKm, formatDuration } from '@/utils/calculations';

interface MapDisplayProps {
  origin: string;
  destination: string;
  onRouteCalculated?: (routeInfo: RouteInfo) => void;
}

export default function MapDisplay({ origin, destination, onRouteCalculated }: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google && window.google.maps) {
      setScriptLoaded(true);
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          setScriptLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError('Failed to load Google Maps');

    document.head.appendChild(script);
  }, []);

  // Initialize map once script is loaded
  useEffect(() => {
    if (!scriptLoaded || !mapRef.current || map) return;

    const newMap = new window.google.maps.Map(mapRef.current, {
      zoom: 4,
      center: { lat: 39.8283, lng: -98.5795 },
    });

    setMap(newMap);
  }, [scriptLoaded, map]);

  // Calculate route when we have origin, destination, and map
  useEffect(() => {
    if (!map || !origin || !destination) return;

    const calculateRoute = async () => {
      setLoading(true);
      setError('');

      try {
        // Call our API route
        const response = await fetch('/api/calculate-route', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ origin, destination }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to calculate route');
        }

        const data = await response.json();

        // Decode and display the polyline
        const path = window.google.maps.geometry.encoding.decodePath(data.polyline);

        // Clear previous polylines
        map.data.forEach((feature) => {
          map.data.remove(feature);
        });

        // Draw the route
        const routePath = new window.google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: '#4285F4',
          strokeOpacity: 1.0,
          strokeWeight: 4,
        });

        routePath.setMap(map);

        // Fit map to route bounds
        const bounds = new window.google.maps.LatLngBounds();
        path.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds);

        // Create route info
        const routeInfo: RouteInfo = {
          distance: data.distance,
          duration: data.duration,
          distanceMiles: metersToMiles(data.distance),
          distanceKm: metersToKm(data.distance),
          durationFormatted: formatDuration(data.duration),
        };

        onRouteCalculated?.(routeInfo);
        setLoading(false);
      } catch (err) {
        console.error('Route calculation error:', err);
        setError(err instanceof Error ? err.message : 'Could not calculate route');
        setLoading(false);
      }
    };

    calculateRoute();
  }, [map, origin, destination, onRouteCalculated]);

  if (!scriptLoaded && !error) {
    return (
      <div className="w-full h-[500px] rounded-lg shadow-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading Google Maps...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Calculating route...
        </div>
      )}
      <div ref={mapRef} className="w-full h-[500px] rounded-lg shadow-lg" />
    </div>
  );
}
