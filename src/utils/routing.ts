export type RouteFeature = {
  type: 'Feature';
  geometry: any;
  properties: { index: number; distance: number; duration: number };
  bbox?: [number, number, number, number] | undefined;
};

export type Profile = 'driving' | 'walking' | 'cycling';

export async function fetchRoutesOSRM(
  profile: Profile,
  from: { lng: number; lat: number },
  to: { lng: number; lat: number }
): Promise<RouteFeature[]> {
  const url = `https://router.project-osrm.org/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?alternatives=true&overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const routes = (data.routes || []) as Array<any>;
  return routes.map((r: any, idx: number) => ({
    type: 'Feature',
    geometry: r.geometry,
    properties: { index: idx, distance: r.distance, duration: r.duration },
    bbox: r.bounds || undefined
  }));
}
