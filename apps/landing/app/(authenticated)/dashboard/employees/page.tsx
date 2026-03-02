import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getSession } from "@/lib/session";
import { DevicesPanel } from "@/components/dashboard/devices-panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { TeamMembersPanel, type TeamMember } from "@/components/dashboard/team-members-panel";

export const metadata: Metadata = { title: "Team & Geräte" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function fetchDevices(cookieHeader: string) {
  const res = await fetch(`${API_URL}/v1/devices`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
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

async function fetchTeamMembers(cookieHeader: string): Promise<TeamMembersResult> {
  try {
    const res = await fetch(`${API_URL}/v1/team/members`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return { members: [], error: true };
    const data = await res.json();
    const members: TeamMember[] = Array.isArray(data.members)
      ? data.members
      : Array.isArray(data)
        ? data
        : [];
    return { members, error: false };
  } catch {
    return { members: [], error: true };
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

  const [devices, registrationToken, billing, teamResult] = await Promise.all([
    fetchDevices(cookieHeader),
    isAdmin ? fetchRegistrationToken(cookieHeader) : Promise.resolve(null),
    fetchBillingSummary(cookieHeader),
    fetchTeamMembers(cookieHeader),
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
        error={teamResult.error}
      />
      <DevicesPanel
        devices={devices}
        licensedCount={licensedCount}
        licenseLimit={null}
        registrationToken={registrationToken}
        isAdmin={isAdmin}
      />
    </div>
  );
}
