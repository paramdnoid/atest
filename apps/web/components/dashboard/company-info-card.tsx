import dynamic from 'next/dynamic';
import { useCallback, useRef } from 'react';
import type { Map as LeafletMapInstance } from 'leaflet';
import { Building2, MapPin, Minus, Plus } from 'lucide-react';

import { DashboardCardHeader } from '@/components/dashboard/dashboard-card';

const LeafletMap = dynamic(
  () => import('@/components/dashboard/leaflet-map').then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="h-full w-full" /> },
);

export type CompanyInfoWorkspace = {
  id: string;
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function CompanyInfoCard({ workspace }: { workspace: CompanyInfoWorkspace }) {
  const lat = workspace.latitude ?? null;
  const lon = workspace.longitude ?? null;
  const hasCoords = lat !== null && lon !== null;
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const handleMapReady = useCallback((map: LeafletMapInstance) => {
    mapRef.current = map;
  }, []);

  const addressLines: string[] = [];
  if (workspace.addressLine1) addressLines.push(workspace.addressLine1);
  if (workspace.addressLine2) addressLines.push(workspace.addressLine2);
  const cityLine = [workspace.postalCode, workspace.city].filter(Boolean).join(' ');
  if (cityLine) addressLines.push(cityLine);
  if (workspace.countryCode) addressLines.push(workspace.countryCode);

  const hasAddress = addressLines.length > 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      {hasCoords && (
        <div className="absolute inset-2 z-0 overflow-hidden rounded-lg border border-black/25">
          <div className="pointer-events-none absolute inset-0 z-10 rounded-lg" />
          <LeafletMap lat={lat} lon={lon} className="h-full w-full" onMapReady={handleMapReady} />
        </div>
      )}

      <div className="absolute inset-0 z-10 bg-background/30" />

      {hasCoords && (
        <div className="absolute right-3 bottom-3 z-30 flex flex-col overflow-hidden rounded-md border border-border/60 shadow-sm">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex h-6 w-6 items-center justify-center bg-background/80 text-foreground hover:bg-background active:bg-muted"
            aria-label="Vergrößern"
          >
            <Plus className="h-3 w-3" />
          </button>
          <div className="h-px bg-border/60" />
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex h-6 w-6 items-center justify-center bg-background/80 text-foreground hover:bg-background active:bg-muted"
            aria-label="Verkleinern"
          >
            <Minus className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="relative z-20 flex flex-col">
        <DashboardCardHeader icon={Building2} label="Unternehmen" title="Firmeninformationen" />

        <div className="flex flex-col gap-3 p-4 pt-1">
          <p className="text-base font-bold leading-tight text-foreground">{workspace.name}</p>

          {hasAddress ? (
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <address className="not-italic">
                {addressLines.map((line, i) => (
                  <span key={i} className="block text-sm text-foreground/80">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Keine Firmenadresse hinterlegt.</p>
          )}
        </div>
      </div>
    </div>
  );
}
