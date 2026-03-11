import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getSession } from "@/lib/session";
import { AppShell } from "@/components/app-shell";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function getWorkspaceName(workspaceId: string, cookieHeader: string): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/v1/workspace/me`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return "Workspace";
    const data = await res.json();
    return data.name ?? "Workspace";
  } catch {
    return "Workspace";
  }
}

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
    .join("; ");

  const workspaceName = await getWorkspaceName(session.workspaceId, cookieHeader);

  return (
    <AppShell
      userEmail={session.email}
      userName={session.fullName ?? undefined}
      workspaceName={workspaceName}
    >
      {children}
    </AppShell>
  );
}
