import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import OLMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Stroke, Style, Circle as CircleStyle, Fill } from 'ol/style';
import Controls from './Controls';
import { useGeolocationManual } from '../hooks/useGeolocation';
import InfoPanel from './InfoPanel';
import { fetchRoutesOSRM, type Profile, type RouteFeature } from '../utils/routing';

export default function OlMapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<OLMap | null>(null);
  const [profile, setProfile] = useState<Profile>('driving');
  const { position: userPos, start: startGeo, started } = useGeolocationManual();
  const [destPos, setDestPos] = useState<{ lng: number; lat: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const routesSource = useMemo(() => new VectorSource(), []);
  const bestSource = useMemo(() => new VectorSource(), []);
  const markersSource = useMemo(() => new VectorSource(), []);

  const routesLayer = useMemo(() => new VectorLayer({
    source: routesSource,
    style: new Style({
      stroke: new Stroke({ color: '#9ca3af', width: 3 })
    })
  }), [routesSource]);

  const bestLayer = useMemo(() => new VectorLayer({
    source: bestSource,
    style: new Style({
      stroke: new Stroke({ color: '#2563eb', width: 6 })
    })
  }), [bestSource]);

  const markersLayer = useMemo(() => new VectorLayer({
    source: markersSource,
    style: (feature) => {
      const kind = feature.get('kind');
      if (kind === 'user') {
        return new Style({
          image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#2563eb' }), stroke: new Stroke({ color: '#ffffff', width: 2 }) })
        });
      }
      return new Style({
        image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#ef4444' }), stroke: new Stroke({ color: '#ffffff', width: 2 }) })
      });
    }
  }), [markersSource]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const defaultCenter: [number, number] = [85.3240, 27.7172];

    mapRef.current = new OLMap({
      target: containerRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attributions: '© OpenStreetMap contributors'
          })
        }),
        routesLayer,
        bestLayer,
        markersLayer
      ],
      view: new View({
        center: fromLonLat(userPos ? [userPos.lng, userPos.lat] : defaultCenter),
        zoom: 6
      })
    });

    mapRef.current.on('click', (evt) => {
      const [lng, lat] = toLonLat(evt.coordinate);
      setDestPos({ lng, lat });
    });

    return () => {
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
    };
  }, [routesLayer, bestLayer, markersLayer, userPos]);
  useEffect(() => {
    if (!mapRef.current || !userPos) return;
    let userFeature = markersSource.getFeatures().find(f => f.get('kind') === 'user');
    if (!userFeature) {
      userFeature = new Feature({ geometry: new Point(fromLonLat([userPos.lng, userPos.lat])) });
      userFeature.set('kind', 'user');
      markersSource.addFeature(userFeature);
    } else {
      (userFeature.getGeometry() as Point).setCoordinates(fromLonLat([userPos.lng, userPos.lat]));
    }
  }, [userPos, markersSource]);
  useEffect(() => {
    if (!mapRef.current || !destPos) return;
    let destFeature = markersSource.getFeatures().find(f => f.get('kind') === 'dest');
    if (!destFeature) {
      destFeature = new Feature({ geometry: new Point(fromLonLat([destPos.lng, destPos.lat])) });
      destFeature.set('kind', 'dest');
      markersSource.addFeature(destFeature);
    } else {
      (destFeature.getGeometry() as Point).setCoordinates(fromLonLat([destPos.lng, destPos.lat]));
    }
  }, [destPos, markersSource]);

  const clearRoutes = useCallback(() => {
    routesSource.clear();
    bestSource.clear();
    setRouteInfo(null);
  }, [routesSource, bestSource]);

  const drawRoutes = useCallback((features: RouteFeature[]) => {
    clearRoutes();
    const olFeatures = features.map((feat) => {
      const coords = (feat.geometry.coordinates as number[][]).map(([lng, lat]) => fromLonLat([lng, lat]));
      const line = new LineString(coords);
      const f = new Feature({ geometry: line });
      f.setProperties(feat.properties);
      return f;
    });
    routesSource.addFeatures(olFeatures);

    const best = features.slice().sort((a, b) => a.properties.duration - b.properties.duration)[0];
    if (best) {
      const bestCoords = (best.geometry.coordinates as number[][]).map(([lng, lat]) => fromLonLat([lng, lat]));
      const bestLine = new LineString(bestCoords);
      const bestFeature = new Feature({ geometry: bestLine });
      bestFeature.setProperties(best.properties);
      bestSource.addFeature(bestFeature);

      // NEW: Set route info (format km and min)
      setRouteInfo({
        distance: Math.round(best.properties.distance / 1000 * 10) / 10,  // meters → km, 1 decimal
        duration: Math.round(best.properties.duration / 60),  // seconds → minutes, whole
      });

      const view = mapRef.current!.getView();
      view.fit(bestLine.getExtent(), { padding: [40, 40, 40, 40], duration: 300 });
    } else {
      // NEW: Clear info if no best route
      setRouteInfo(null);
    }
  }, [routesSource, bestSource, clearRoutes]);

  const recalc = useCallback(async () => {
    if (!userPos || !destPos) return;
    const feats = await fetchRoutesOSRM(profile, userPos, destPos);
    if (feats.length) drawRoutes(feats);
  }, [userPos, destPos, profile, drawRoutes]);

  useEffect(() => { recalc(); }, [recalc]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      <Controls
        profile={profile}
        setProfile={setProfile}
        canRecalc={!!userPos && !!destPos}
        onRecalc={recalc}
        onClear={() => {
          setDestPos(null);
          clearRoutes();

          const dest = markersSource.getFeatures().find(f => f.get('kind') === 'dest');
          if (dest) markersSource.removeFeature(dest);
        }}
        onEnableLocation={() => { startGeo(); }}
        locationEnabled={started}
      />
      <InfoPanel routeInfo={routeInfo} />
    </div>
  );
}
