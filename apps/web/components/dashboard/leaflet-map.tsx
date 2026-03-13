'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMapInstance, Marker } from 'leaflet';

type LeafletMapProps = {
  lat: number;
  lon: number;
  className?: string;
  onMapReady?: (map: LeafletMapInstance) => void;
};

export function LeafletMap({ lat, lon, className, onMapReady }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    markerRef.current?.setLatLng([lat, lon]);
    mapRef.current.flyTo([lat, lon], 18, { duration: 1.2 });
  }, [lat, lon]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let aborted = false;

    async function init() {
      if (!containerRef.current) return;

      const L = (await import('leaflet')).default;
      if (aborted || mapRef.current || !containerRef.current) return;
      if ('_leaflet_id' in containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
        iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
        shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
      });

      const map = L.map(containerRef.current, {
        center: [lat, lon],
        zoom: 3,
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      markerRef.current = L.marker([lat, lon]).addTo(map);
      map.flyTo([lat, lon], 18, { duration: 1.8 });

      mapRef.current = map;
      onMapReady?.(map);
    }

    init();

    return () => {
      aborted = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className} />;
}
