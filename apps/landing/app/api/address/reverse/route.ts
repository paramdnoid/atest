import { NextRequest, NextResponse } from "next/server";

type NominatimReverseResult = {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    country_code?: string;
  };
};

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

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "zunftgewerk-landing/1.0" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Nominatim request failed" }, { status: 502 });
  }

  const result = (await res.json()) as NominatimReverseResult;
  const addr = result.address;
  const road = addr.road ?? "";
  const houseNumber = addr.house_number ?? "";
  const addressLine1 = houseNumber ? `${road} ${houseNumber}`.trim() : road;
  const city = addr.city ?? addr.town ?? addr.village ?? "";
  const countryCode = (addr.country_code ?? "").toUpperCase();

  return NextResponse.json({
    label: result.display_name,
    addressLine1,
    postalCode: addr.postcode ?? "",
    city,
    countryCode,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
  });
}
