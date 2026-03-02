"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const countryOptions = [
  { code: "DE", label: "Deutschland" },
  { code: "AT", label: "Oesterreich" },
  { code: "CH", label: "Schweiz" },
] as const;

export type AddressFieldGroupValues = {
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  countryCode: string;
};

type AddressFieldGroupProps = {
  values: AddressFieldGroupValues;
  onChange: (field: keyof AddressFieldGroupValues, value: string) => void;
  idPrefix?: string;
  disabled?: boolean;
};

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:outline-none";

export function AddressFieldGroup({ values, onChange, idPrefix = "", disabled }: AddressFieldGroupProps) {
  const id = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);

  return (
    <>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={id("address-line1")}>Strasse &amp; Hausnummer</Label>
        <Input
          id={id("address-line1")}
          value={values.addressLine1}
          onChange={(e) => onChange("addressLine1", e.target.value)}
          disabled={disabled}
          className="h-10"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={id("address-line2")}>Adresszusatz</Label>
        <Input
          id={id("address-line2")}
          value={values.addressLine2}
          onChange={(e) => onChange("addressLine2", e.target.value)}
          disabled={disabled}
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={id("postal-code")}>PLZ</Label>
        <Input
          id={id("postal-code")}
          value={values.postalCode}
          onChange={(e) => onChange("postalCode", e.target.value)}
          disabled={disabled}
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={id("city")}>Ort</Label>
        <Input
          id={id("city")}
          value={values.city}
          onChange={(e) => onChange("city", e.target.value)}
          disabled={disabled}
          className="h-10"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={id("country")}>Land</Label>
        <select
          id={id("country")}
          value={values.countryCode}
          onChange={(e) => onChange("countryCode", e.target.value)}
          disabled={disabled}
          className={selectClassName}
        >
          <option value="">Bitte wählen...</option>
          {countryOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
