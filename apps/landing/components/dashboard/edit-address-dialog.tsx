"use client";

import { useEffect, useRef, useState } from "react";

import { fetchApi } from "@/lib/api-client";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Building2, Crosshair, MapPin } from "lucide-react";

import { AddressFieldGroup, type AddressFieldGroupValues } from "@/components/billing/address-field-group";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Suggestion = {
  placeId: string;
  label: string;
  line1: string;
  postalCode: string;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
};

function SuggestionDropdown({
  anchorRef,
  suggestions,
  onSelect,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  suggestions: Suggestion[];
  onSelect: (s: Suggestion) => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    function update() {
      if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorRef]);

  if (!rect) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      }}
      className="max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
    >
      {suggestions.map((s, idx) => (
        <div key={`${s.placeId}-${idx}`}>
          {idx > 0 && <div className="h-px bg-border/50" />}
          <button
            type="button"
            onMouseDown={() => onSelect(s)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent hover:text-accent-foreground"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <MapPin className="h-3 w-3" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight">{s.line1}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[s.postalCode, s.city, s.countryCode].filter(Boolean).join(" · ")}
              </p>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}

type EditAddressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: {
    addressLine1: string;
    addressLine2: string;
    postalCode: string;
    city: string;
    countryCode: string;
  };
};

export function EditAddressDialog({
  open,
  onOpenChange,
  initial,
}: EditAddressDialogProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const [address, setAddress] = useState<AddressFieldGroupValues>({
    addressLine1: initial.addressLine1,
    addressLine2: initial.addressLine2,
    postalCode: initial.postalCode,
    city: initial.city,
    countryCode: initial.countryCode,
  });
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/address/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          if (!res.ok) {
            const data = await res.json() as { error?: string };
            setError(data.error ?? "Standort konnte nicht ermittelt werden.");
            return;
          }
          const data = await res.json() as {
            label: string;
            addressLine1: string;
            postalCode: string;
            city: string;
            countryCode: string;
            latitude: number;
            longitude: number;
          };
          setAddress((prev) => ({
            ...prev,
            addressLine1: data.addressLine1,
            postalCode: data.postalCode,
            city: data.city,
            countryCode: data.countryCode,
          }));
          setCoords({ latitude: data.latitude, longitude: data.longitude });
          setQuery(data.label);
          setShowDropdown(false);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError("Standortzugriff verweigert oder nicht verfügbar.");
        setLocating(false);
      },
    );
  }

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setSuggestions([]);
      setShowDropdown(false);
      setAddress({
        addressLine1: initial.addressLine1,
        addressLine2: initial.addressLine2,
        postalCode: initial.postalCode,
        city: initial.city,
        countryCode: initial.countryCode,
      });
      setCoords(null);
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/address/autocomplete?q=${encodeURIComponent(value)}&limit=12`);
        if (res.ok) {
          const data = await res.json() as { suggestions: Suggestion[] };
          setSuggestions(data.suggestions);
          setShowDropdown(data.suggestions.length > 0);
        }
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  }

  function handleSelect(s: Suggestion) {
    setAddress((prev) => ({
      ...prev,
      addressLine1: s.line1,
      postalCode: s.postalCode,
      city: s.city,
      countryCode: s.countryCode,
    }));
    setCoords({ latitude: s.latitude, longitude: s.longitude });
    setQuery(s.label);
    setShowDropdown(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...address,
        ...(coords ?? {}),
      };
      const res = await fetchApi(`/v1/workspace/me/address`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError("Speichern fehlgeschlagen. Bitte versuche es erneut.");
        return;
      }
      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-md">
        {/* Card-style header */}
        <div className="flex items-center gap-3 px-4 pt-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_2px_8px_color-mix(in_oklch,var(--color-primary)_40%,transparent)]">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Unternehmen
            </p>
            <p className="text-sm font-semibold leading-tight">Firmenadresse bearbeiten</p>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-4 py-0">
          {/* Autocomplete search */}
          <div className="space-y-1.5">
            <Label htmlFor="addr-search">Adresse suchen</Label>
            <div className="relative" ref={inputWrapperRef}>
              <Input
                id="addr-search"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder="Strasse, Hausnummer, Ort"
                disabled={saving || locating}
                autoComplete="new-password"
                className="h-10 pr-9"
              />
              <button
                type="button"
                onClick={handleLocate}
                disabled={saving || locating}
                title="Aktuelle Position ermitteln"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <Crosshair className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
              </button>
            </div>
            {showDropdown && suggestions.length > 0 && typeof document !== "undefined" &&
              createPortal(
                <SuggestionDropdown
                  anchorRef={inputWrapperRef}
                  suggestions={suggestions}
                  onSelect={handleSelect}
                />,
                document.body,
              )}
            <p className="text-xs text-muted-foreground">
              {loadingSuggestions ? "Suche läuft…" : "Autocomplete ist auf DACH (DE/AT/CH) priorisiert."}
            </p>
          </div>

          {/* Manual fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AddressFieldGroup
              idPrefix="edit"
              values={address}
              onChange={(field, value) => setAddress((prev) => ({ ...prev, [field]: value }))}
              disabled={saving}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Card-style footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
