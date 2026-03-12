import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { buildCookieHeader } from "@/lib/server-cookie";
import { PageHeader } from "@/components/dashboard/page-header";
import { WorkspaceSettingsForm } from "@/components/dashboard/workspace-settings-form";
import { MfaSection } from "@/components/dashboard/mfa-section";

export const metadata: Metadata = { title: "Einstellungen" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function fetchWorkspace(cookieHeader: string) {
  const res = await fetch(`${API_URL}/v1/workspace/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchMfaStatus(cookieHeader: string) {
  const res = await fetch(`${API_URL}/v1/auth/mfa/status`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.mfaEnabled === true;
}

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cookieHeader = await buildCookieHeader();

  const [workspace, mfaEnabled] = await Promise.all([
    fetchWorkspace(cookieHeader),
    fetchMfaStatus(cookieHeader),
  ]);

  if (!workspace) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Einstellungen"
        description="Workspace-Konfiguration anpassen."
      />
      <WorkspaceSettingsForm
        initialName={workspace.name}
        initialSlug={workspace.slug ?? ""}
      />
      <MfaSection initialMfaEnabled={mfaEnabled} />
    </div>
  );
}
