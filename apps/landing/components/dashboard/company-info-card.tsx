"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import type { Map as LeafletMapInstance } from "leaflet";

import { Building2, MapPin, Minus, Pencil, Plus } from "lucide-react";

import { DashboardCardHeader } from "@/components/dashboard/dashboard-card";
import { EditAddressDialog } from "@/components/dashboard/edit-address-dialog";

const LeafletMap = dynamic(
  () => import("@/components/dashboard/leaflet-map").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="h-full w-full" /> },
);

type CompanyInfoWorkspace = {
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
  const [editOpen, setEditOpen] = useState(false);

  const addressLines: string[] = [];
  if (workspace.addressLine1) addressLines.push(workspace.addressLine1);
  if (workspace.addressLine2) addressLines.push(workspace.addressLine2);
  const cityLine = [workspace.postalCode, workspace.city].filter(Boolean).join(" ");
  if (cityLine) addressLines.push(cityLine);
  if (workspace.countryCode) addressLines.push(workspace.countryCode);

  const hasAddress = addressLines.length > 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      {/* map as full background */}
      {hasCoords && (
        <div className="absolute inset-2 z-0 overflow-hidden rounded-lg border border-black/25">
          <div className="pointer-events-none absolute inset-0 z-10 rounded-lg" />
          <LeafletMap lat={lat!} lon={lon!} className="h-full w-full" onMapReady={handleMapReady} />
        </div>
      )}

      {/* overlay for readability */}
      <div className="absolute inset-0 z-10 bg-background/30" />

      {/* custom zoom controls — rendered outside the map's stacking context */}
      {hasCoords && (
        <div className="absolute bottom-3 right-3 z-30 flex flex-col overflow-hidden rounded-md border border-border/60 shadow-sm">
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

      {/* content */}
      <div className="relative z-20 flex flex-col">
        {/* header */}
        <DashboardCardHeader
          icon={Building2}
          label="Unternehmen"
          title="Firmeninformationen"
          action={
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
            >
              <Pencil className="h-3 w-3" />
              Bearbeiten
            </button>
          }
        />

        {/* body */}
        <div className="flex flex-col gap-3 p-4 pt-1">
          <p className="text-base font-bold leading-tight text-foreground">
            {workspace.name}
          </p>

          {hasAddress && (
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <address className="not-italic">
                {addressLines.map((line, i) => (
                  <span key={i} className="block text-sm text-foreground/80">{line}</span>
                ))}
              </address>
            </div>
          )}
        </div>
      </div>

      <EditAddressDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={{
          addressLine1: workspace.addressLine1 ?? "",
          addressLine2: workspace.addressLine2 ?? "",
          postalCode: workspace.postalCode ?? "",
          city: workspace.city ?? "",
          countryCode: workspace.countryCode ?? "",
        }}
      />
    </div>
  );
}
