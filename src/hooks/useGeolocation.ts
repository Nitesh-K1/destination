import { useEffect, useRef, useState, useCallback } from 'react';

export type LngLat = { lng: number; lat: number };

export function useGeolocation(options: PositionOptions = { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }) {
  const [position, setPosition] = useState<LngLat | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    if (watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lng: longitude, lat: latitude });
      },
      () => {},
      options
    );
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [options]);

  return position;
}

export function useGeolocationManual(options: PositionOptions = { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }) {
  const [position, setPosition] = useState<LngLat | null>(null);
  const [started, setStarted] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStarted(false);
  }, []);

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    if (watchIdRef.current !== null) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lng: longitude, lat: latitude });
      },
      () => {},
      options
    );
    setStarted(true);
  }, [options]);

  useEffect(() => () => stop(), [stop]);

  return { position, start, stop, started } as const;
}
