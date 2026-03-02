import { CreditCard, ShieldCheck, Users } from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { formatSubscriptionStatus } from "@/lib/format";

export function StatsGrid({
  memberCount,
  planName,
  subscriptionStatus,
  trialLabel,
}: {
  memberCount: number;
  planName: string;
  subscriptionStatus: string;
  trialLabel?: string | null;
}) {
  const statusLabel =
    subscriptionStatus === "none" ? "Kein Abo" : formatSubscriptionStatus(subscriptionStatus);

  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const statusSubtitle = isActive ? "Aktives Abonnement" : undefined;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        icon={Users}
        label="Teammitglieder"
        value={memberCount}
        subtitle={memberCount === 1 ? "Person im Workspace" : "Personen im Workspace"}
      />
      <StatCard
        icon={CreditCard}
        label="Aktueller Plan"
        value={planName}
        trialLabel={trialLabel ?? undefined}
      />
      <StatCard
        icon={ShieldCheck}
        label="Abo-Status"
        value={statusLabel}
        subtitle={statusSubtitle}
      />
    </div>
  );
}
