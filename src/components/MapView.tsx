import { useRef, useEffect, useState, useCallback } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import "@maptiler/sdk/dist/maptiler-sdk.css";
import Controls from './Controls';
import { useGeolocation } from '../hooks/useGeolocation';
import { fetchRoutesOSRM, type Profile } from '../utils/routing';

export default function Map() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const zoom = 14;
  const userPos = useGeolocation();
  const [destPos, setDestPos] = useState<{lng:number,lat:number}|null>(null);
  const [profile, setProfile] = useState<Profile>('driving');
  const userMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const destMarkerRef = useRef<maptilersdk.Marker | null>(null);
  const routesSourceId = useRef<string>('routes-source');
  const bestSourceId = useRef<string>('route-best-source');
  const routesLayerId = useRef<string>('routes-layer');
  const bestLayerId = useRef<string>('route-best-layer');
  maptilersdk.config.apiKey = 'zuloBs8phR3VHAEENY9a';

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: [0, 0],
      zoom: zoom
    });

    map.current.on('load', () => {
      if (userPos) {
        map.current!.setCenter([userPos.lng, userPos.lat]);
      }
    });

    map.current.on('click', (e) => {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      setDestPos({ lng, lat });
    });

  }, [userPos, zoom]);

  useEffect(() => {
    if (!map.current) return;
    if (!userPos) return;
    if (!userMarkerRef.current) {
      userMarkerRef.current = new maptilersdk.Marker({ color: '#2563eb' });
    }
    userMarkerRef.current.setLngLat([userPos.lng, userPos.lat]).addTo(map.current);
  }, [userPos]);

  useEffect(() => {
    if (!map.current) return;
    if (!destPos) return;
    if (!destMarkerRef.current) {
      destMarkerRef.current = new maptilersdk.Marker({ color: '#ef4444' });
    }
    destMarkerRef.current.setLngLat([destPos.lng, destPos.lat]).addTo(map.current);
  }, [destPos]);

  const clearRoutes = useCallback(() => {
    if (!map.current) return;
    if (map.current.getLayer(bestLayerId.current)) {
      map.current.removeLayer(bestLayerId.current);
    }
    if (map.current.getLayer(routesLayerId.current)) {
      map.current.removeLayer(routesLayerId.current);
    }
    if (map.current.getSource(bestSourceId.current)) {
      map.current.removeSource(bestSourceId.current);
    }
    if (map.current.getSource(routesSourceId.current)) {
      map.current.removeSource(routesSourceId.current);
    }
  }, []);

  const drawRoutes = useCallback((features: any[]) => {
    if (!map.current) return;
    clearRoutes();
    const collection = { type: 'FeatureCollection', features } as any;
    const best = features.slice().sort((a,b)=>a.properties.duration-b.properties.duration)[0];

    map.current.addSource(routesSourceId.current, { type: 'geojson', data: collection });
    map.current.addLayer({
      id: routesLayerId.current,
      type: 'line',
      source: routesSourceId.current,
      paint: {
        'line-color': '#9ca3af',
        'line-width': 4,
        'line-opacity': 0.7
      }
    });

    map.current.addSource(bestSourceId.current, { type: 'geojson', data: best });
    map.current.addLayer({
      id: bestLayerId.current,
      type: 'line',
      source: bestSourceId.current,
      paint: {
        'line-color': '#2563eb',
        'line-width': 6
      }
    });

    if (best && best.bbox) {
      const b = best.bbox as [number, number, number, number];
      map.current.fitBounds([[b[0], b[1]],[b[2], b[3]]], { padding: 40, animate: true });
    } else if (userPos && destPos) {
      map.current.fitBounds([[userPos.lng, userPos.lat],[destPos.lng, destPos.lat]], { padding: 60, animate: true });
    }
  }, [clearRoutes, userPos, destPos]);

  const fetchRoutes = useCallback(async () => {
    if (!userPos || !destPos) return;
    const features = await fetchRoutesOSRM(profile, userPos, destPos);
    if (features.length) drawRoutes(features);
  }, [userPos, destPos, profile, drawRoutes]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  useEffect(() => {
    return () => {
      if (map.current) {
        clearRoutes();
        map.current.remove();
        map.current = null;
      }
    };
  }, [clearRoutes]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="h-full w-full" />
      <Controls
        profile={profile}
        setProfile={setProfile}
        canRecalc={!!userPos && !!destPos}
        onRecalc={fetchRoutes}
        onClear={() => {
          setDestPos(null);
          clearRoutes();
          if (destMarkerRef.current) { destMarkerRef.current.remove(); destMarkerRef.current = null; }
        }}
      />
    </div>
  );
}