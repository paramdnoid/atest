import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getSession } from "@/lib/session";
import { DevicesPanel, type Device } from "@/components/dashboard/devices-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { TeamMembersPanel, type TeamMember } from "@/components/dashboard/team-members-panel";
import {
  parseDevicesResponse,
  parseSeatSummaryResponse,
  parseTeamSeatsResponse,
} from "@/lib/dashboard/license-parsers";

export const metadata: Metadata = { title: "Team & Geräte" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type DevicesResult =
  | { devices: Device[]; error: false }
  | { devices: []; error: true };

async function fetchDevices(cookieHeader: string): Promise<DevicesResult> {
  try {
    const res = await fetch(`${API_URL}/v1/devices`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return { devices: [], error: true };
    const data = await res.json();
    return { devices: parseDevicesResponse(data), error: false };
  } catch {
    return { devices: [], error: true };
  }
}

async function fetchRegistrationToken(cookieHeader: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/v1/devices/registration-token`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.token || null;
}

async function fetchBillingSummary(cookieHeader: string) {
  const res = await fetch(`${API_URL}/v1/billing/summary`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

type TeamMembersResult =
  | { members: TeamMember[]; error: false }
  | { members: []; error: true };

type SeatSummaryResult =
  | {
      includedSeats: number;
      usedSeats: number;
      availableSeats: number;
      overLimit: boolean;
      error: false;
    }
  | {
      includedSeats: 0;
      usedSeats: 0;
      availableSeats: 0;
      overLimit: false;
      error: true;
    };

async function fetchTeamMembers(cookieHeader: string): Promise<TeamMembersResult> {
  try {
    const res = await fetch(`${API_URL}/v1/licenses/seats`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return { members: [], error: true };
    const data = await res.json();
    const members: TeamMember[] = parseTeamSeatsResponse(data);
    return { members, error: false };
  } catch {
    return { members: [], error: true };
  }
}

async function fetchSeatSummary(cookieHeader: string): Promise<SeatSummaryResult> {
  try {
    const res = await fetch(`${API_URL}/v1/licenses/summary`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        includedSeats: 0,
        usedSeats: 0,
        availableSeats: 0,
        overLimit: false,
        error: true,
      };
    }
    const data = parseSeatSummaryResponse(await res.json());
    return {
      includedSeats: data.includedSeats,
      usedSeats: data.usedSeats,
      availableSeats: data.availableSeats,
      overLimit: data.overLimit,
      error: false,
    };
  } catch {
    return {
      includedSeats: 0,
      usedSeats: 0,
      availableSeats: 0,
      overLimit: false,
      error: true,
    };
  }
}

export default async function EmployeesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "admin" || session.role === "owner";

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const [devicesResult, registrationToken, billing, teamResult, seatSummary] = await Promise.all([
    fetchDevices(cookieHeader),
    isAdmin ? fetchRegistrationToken(cookieHeader) : Promise.resolve(null),
    fetchBillingSummary(cookieHeader),
    fetchTeamMembers(cookieHeader),
    fetchSeatSummary(cookieHeader),
  ]);

  const licensedCount = billing?.licensedCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team & Geräte"
        description="Verwalte Teammitglieder, Gerätezugänge und Lizenzen für deinen Workspace."
      />
      <TeamMembersPanel
        members={teamResult.members}
        error={teamResult.error || seatSummary.error}
        isAdmin={isAdmin}
        seatSummary={{
          includedSeats: seatSummary.includedSeats,
          usedSeats: seatSummary.usedSeats,
          availableSeats: seatSummary.availableSeats,
          overLimit: seatSummary.overLimit,
        }}
      />
      <DevicesPanel
        devices={devicesResult.devices}
        error={devicesResult.error}
        licensedCount={licensedCount}
        licenseLimit={null}
        registrationToken={registrationToken}
        isAdmin={isAdmin}
      />
    </div>
  );
}
