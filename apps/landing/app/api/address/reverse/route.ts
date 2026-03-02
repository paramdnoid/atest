import { NextRequest, NextResponse } from "next/server";
import type { AddressSuggestion } from "@/lib/onboarding/types";

type NominatimReverseResult = {
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

function extractLine1(r: NominatimReverseResult): string {
  const addr = r.address;
  const houseNumber = addr.house_number ?? "";

  if (addr.road) {
    return houseNumber ? `${addr.road} ${houseNumber}`.trim() : addr.road;
  }

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

  return addr.hamlet ?? addr.farm ?? addr.isolated_dwelling ?? addr.quarter ?? addr.neighbourhood ?? addr.suburb ?? houseNumber;
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);
  if (isNaN(latNum) || isNaN(lonNum)) {
    return NextResponse.json({ error: "lat and lon must be valid numbers" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "zunftgewerk-landing/1.0" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Nominatim request failed" }, { status: 502 });
  }

  const result = (await res.json()) as NominatimReverseResult;
  const addr = result.address;
  const rawCode = (addr.country_code ?? "").toUpperCase();
  const countryCode = (rawCode === "DE" || rawCode === "AT" || rawCode === "CH" ? rawCode : "DE") as "DE" | "AT" | "CH";

  const suggestion: AddressSuggestion = {
    placeId: String(result.place_id),
    label: result.display_name,
    line1: extractLine1(result),
    postalCode: addr.postcode ?? "",
    city: addr.village ?? addr.town ?? addr.city ?? "",
    countryCode,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    provider: "nominatim",
  };

  return NextResponse.json({ suggestion });
}
