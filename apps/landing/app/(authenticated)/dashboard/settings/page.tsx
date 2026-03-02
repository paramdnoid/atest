import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/dashboard/page-header";
import { WorkspaceSettingsForm } from "@/components/dashboard/workspace-settings-form";

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

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const workspace = await fetchWorkspace(cookieHeader);
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
    </div>
  );
}
