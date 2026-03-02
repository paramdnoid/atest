import { NextRequest, NextResponse } from "next/server";
import type { AddressSuggestion } from "@/lib/onboarding/types";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    hamlet?: string;
    isolated_dwelling?: string;
    farm?: string;
    quarter?: string;
    neighbourhood?: string;
    suburb?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    country_code?: string;
  };
};

function extractLine1(r: NominatimResult): string {
  const addr = r.address;
  const houseNumber = addr.house_number ?? "";

  // Standard case: formal road name present
  if (addr.road) {
    return houseNumber ? `${addr.road} ${houseNumber}`.trim() : addr.road;
  }

  // No formal road: parse display_name to find the place name.
  // Nominatim puts house_number first for DACH house-level results:
  // "119a, Caltgera, Las Fueinas, Lumbrein, ..." → "Caltgera 119a"
  if (houseNumber) {
    const parts = r.display_name.split(", ");
    const hnIdx = parts.findIndex((p) => p.trim() === houseNumber.trim());
    if (hnIdx >= 0 && hnIdx + 1 < parts.length) {
      const candidate = parts[hnIdx + 1].trim();
      if (candidate && !/^\d{4,6}$/.test(candidate)) {
        return `${candidate} ${houseNumber}`.trim();
      }
    }
  }

  // Final fallback: any named sub-locality (place-only results)
  return addr.hamlet ?? addr.farm ?? addr.isolated_dwelling ?? addr.quarter ?? addr.neighbourhood ?? addr.suburb ?? houseNumber;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 3) {
    return NextResponse.json({ error: "q must be at least 3 characters" }, { status: 400 });
  }

  const limitParam = parseInt(req.nextUrl.searchParams.get("limit") ?? "6", 10);
  const limit = Math.min(isNaN(limitParam) || limitParam < 1 ? 6 : limitParam, 12);

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("countrycodes", "de,at,ch");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "zunftgewerk-landing/1.0" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Nominatim request failed" }, { status: 502 });
  }

  const results = (await res.json()) as NominatimResult[];

  const suggestions: AddressSuggestion[] = results.map((r) => {
    const addr = r.address;
    const line1 = extractLine1(r);
    const city = addr.village ?? addr.town ?? addr.city ?? "";
    const rawCode = (addr.country_code ?? "").toUpperCase();
    const countryCode = (rawCode === "DE" || rawCode === "AT" || rawCode === "CH" ? rawCode : "DE") as "DE" | "AT" | "CH";

    return {
      placeId: String(r.place_id),
      label: r.display_name,
      line1,
      postalCode: addr.postcode ?? "",
      city,
      countryCode,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      provider: "nominatim",
    };
  });

  return NextResponse.json({ suggestions });
}
