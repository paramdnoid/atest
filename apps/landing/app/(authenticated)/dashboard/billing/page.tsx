import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getSession } from "@/lib/session";
import { BillingEventsTable } from "@/components/dashboard/billing-events-table";
import { ManageSubscriptionButton } from "@/components/dashboard/manage-subscription-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlanCard } from "@/components/dashboard/plan-card";
import { PlanSwitcherSection } from "@/components/dashboard/plan-switcher-section";
import type { AvailablePlan } from "@/components/dashboard/plan-switcher-section";
import { UsageLimitsCard } from "@/components/dashboard/usage-limits-card";

export const metadata: Metadata = { title: "Abrechnung" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

type BillingSummary = {
  plan: {
    code: string;
    name: string;
    priceMonthlyCents: number;
  } | null;
  subscription: {
    status: string;
    billingInterval: string;
    currentPeriodEnd: string | null;
    stripeSubscriptionId: string | null;
  } | null;
  memberCount: number;
  licensedCount: number;
};

async function fetchBillingSummary(
  cookieHeader: string,
): Promise<BillingSummary | null> {
  try {
    const res = await fetch(`${API_URL}/v1/billing/summary`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<BillingSummary>;
  } catch {
    return null;
  }
}

async function fetchAvailablePlans(
  cookieHeader: string,
): Promise<AvailablePlan[]> {
  try {
    const res = await fetch(`${API_URL}/v1/plans`, {
      headers: { Cookie: cookieHeader },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json() as Promise<AvailablePlan[]>;
  } catch {
    return [];
  }
}

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const [billing, availablePlans] = await Promise.all([
    fetchBillingSummary(cookieHeader),
    fetchAvailablePlans(cookieHeader),
  ]);

  const plan = billing?.plan;
  const subscription = billing?.subscription;
  const memberCount = billing?.memberCount ?? 0;
  const licensedCount = billing?.licensedCount ?? 0;

  const usageItems = [
    { label: "Mitglieder", current: memberCount, limit: null as number | null },
    {
      label: "Gerätelizenzen",
      current: licensedCount,
      limit: null as number | null,
    },
  ].filter((item) => item.current > 0 || item.limit != null);

  return (
    <div className="space-y-8">
      <PageHeader title="Abrechnung" description="Plan, Nutzung und Rechnungen.">
        {subscription?.stripeSubscriptionId && <ManageSubscriptionButton />}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <PlanCard
          planName={plan?.name ?? "Free"}
          planCode={plan?.code ?? "free"}
          priceCents={plan?.priceMonthlyCents ?? 0}
          billingInterval={subscription?.billingInterval}
          status={subscription?.status ?? "none"}
          currentPeriodEnd={subscription?.currentPeriodEnd}
        />
        <UsageLimitsCard items={usageItems} />
      </div>

      {availablePlans.length > 0 && (
        <PlanSwitcherSection
          plans={availablePlans}
          currentPlanCode={plan?.code}
        />
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Abrechnungsereignisse</h2>
        <BillingEventsTable />
      </div>
    </div>
  );
}
