import { type ReactNode } from 'react';

type RouteInfo = { distance: number; duration: number } | null;

export default function InfoPanel({ routeInfo }: { routeInfo: RouteInfo }) {
  if (!routeInfo) return null;

  const formatDistance = (meters: number): string => `${(meters / 1000).toFixed(1)} km`;
  const formatDuration = (seconds: number): string => `${Math.round(seconds / 60)} min`;

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur rounded shadow px-3 py-2 text-sm">
      <div className="font-medium text-gray-700">Best Route</div>
      <div className="text-gray-600">
        Distance: {formatDistance(routeInfo.distance * 1000)} {/* Back to meters for format */}
        <span className="mx-2">•</span>
        Time: {formatDuration(routeInfo.duration * 60)}
      </div>
    </div>
  );
}