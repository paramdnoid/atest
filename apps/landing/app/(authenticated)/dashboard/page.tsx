import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { buildCookieHeader } from "@/lib/server-cookie";
import { CompanyInfoCard } from "@/components/dashboard/company-info-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function fetchWorkspace(cookieHeader: string) {
  const res = await fetch(`${API_URL}/v1/workspace/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchBillingSummary(cookieHeader: string) {
  const res = await fetch(`${API_URL}/v1/billing/summary`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cookieHeader = await buildCookieHeader();

  const [workspace, billing] = await Promise.all([
    fetchWorkspace(cookieHeader),
    fetchBillingSummary(cookieHeader),
  ]);

  const planName = billing?.plan?.name ?? "Kein Plan";
  const subscriptionStatus = billing?.subscription?.status ?? "none";
  const memberCount = workspace?.memberCount ?? billing?.memberCount ?? 0;
  const recentEvents = billing?.recentEvents ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Übersicht"
        description={workspace?.name ?? "Workspace"}
        badge={
          <Badge
            variant="outline"
            className="border-(--enterprise-accent)/40 bg-(--enterprise-accent-soft) text-(--enterprise-accent) font-mono text-xs"
          >
            {planName}
          </Badge>
        }
      />
      <StatsGrid
        memberCount={memberCount}
        planName={planName}
        subscriptionStatus={subscriptionStatus}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivity
          events={recentEvents.map((e: { type: string; createdAt: string }, i: number) => ({
            id: String(i),
            type: e.type,
            occurredAt: e.createdAt,
          }))}
          className="h-full"
        />
        <div className="flex flex-col gap-4">
          {workspace && (
            <CompanyInfoCard workspace={workspace} />
          )}
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
