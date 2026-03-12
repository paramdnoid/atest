import { CreditCard, ShieldCheck, Users } from 'lucide-react';

import { KpiStrip } from '@/components/dashboard/kpi-strip';
import { formatSubscriptionStatus } from '@/lib/format';

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
    subscriptionStatus === 'none' ? 'Kein Abo' : formatSubscriptionStatus(subscriptionStatus);

  const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
  const statusSubtitle = isActive ? 'Aktives Abonnement' : undefined;

  return (
    <KpiStrip
      items={[
        {
          icon: Users,
          label: 'Teammitglieder',
          value: memberCount,
          subtitle: memberCount === 1 ? 'Person im Workspace' : 'Personen im Workspace',
        },
        {
          icon: CreditCard,
          label: 'Aktueller Plan',
          value: planName,
          trialLabel: trialLabel ?? undefined,
          accent: true,
        },
        {
          icon: ShieldCheck,
          label: 'Abo-Status',
          value: statusLabel,
          subtitle: statusSubtitle,
        },
      ]}
    />
  );
}
