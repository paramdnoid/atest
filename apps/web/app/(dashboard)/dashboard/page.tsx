'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, ShieldCheck, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/session-token';
import { Badge } from '@/components/ui/badge';
import {
  CompanyInfoCard,
  type CompanyInfoWorkspace,
} from '@/components/dashboard/company-info-card';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { formatDate, formatSubscriptionStatus } from '@/lib/format';

type RawWorkspace = {
  tenantId?: string;
  id?: string;
  workspaceName?: string;
  name?: string;
  tradeName?: string;
  email?: string;
  role?: string;
  memberCount?: number;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  countryCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  latitude_deg?: number | null;
  longitude_deg?: number | null;
};

type RawBillingPlan = {
  name?: string | null;
};

type RawBillingSubscription = {
  status?: string | null;
  trialEndsAt?: string | null;
  trialEnd?: string | null;
  currentPeriodEnd?: string | null;
};

type RawBillingEvent = {
  id?: string | number;
  type?: string;
  createdAt?: string;
  occurredAt?: string;
  timestamp?: string;
};

type RawBillingSummary = {
  planName?: string | null;
  status?: string | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  memberCount?: number;
  plan?: RawBillingPlan | null;
  subscription?: RawBillingSubscription | null;
  recentEvents?: RawBillingEvent[] | null;
};

type TeamMember = {
  userId?: string;
  tradeName?: string;
};

type TeamMembersResponse = {
  members?: TeamMember[];
};

type NormalizedRecentEvent = {
  id: string;
  type: string;
  occurredAt: string;
};

type DashboardData = {
  workspace: CompanyInfoWorkspace;
  planName: string;
  subscriptionStatus: string;
  trialLabel?: string;
  memberCount: number;
  recentEvents: NormalizedRecentEvent[];
  hasPartialDataError: boolean;
};

const defaultWorkspace: CompanyInfoWorkspace = {
  id: 'workspace',
  name: 'Workspace',
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  city: null,
  countryCode: null,
  latitude: null,
  longitude: null,
};

function normalizeWorkspace(rawWorkspace: RawWorkspace | null): CompanyInfoWorkspace {
  if (!rawWorkspace) return defaultWorkspace;
  return {
    id: rawWorkspace.tenantId ?? rawWorkspace.id ?? defaultWorkspace.id,
    name:
      rawWorkspace.workspaceName ??
      rawWorkspace.name ??
      rawWorkspace.tradeName ??
      defaultWorkspace.name,
    addressLine1: rawWorkspace.addressLine1 ?? rawWorkspace.address_line_1 ?? null,
    addressLine2: rawWorkspace.addressLine2 ?? rawWorkspace.address_line_2 ?? null,
    postalCode: rawWorkspace.postalCode ?? rawWorkspace.postal_code ?? null,
    city: rawWorkspace.city ?? null,
    countryCode: rawWorkspace.countryCode ?? rawWorkspace.country_code ?? null,
    latitude: rawWorkspace.latitude ?? rawWorkspace.latitude_deg ?? null,
    longitude: rawWorkspace.longitude ?? rawWorkspace.longitude_deg ?? null,
  };
}

function normalizeRecentEvents(rawBilling: RawBillingSummary | null): NormalizedRecentEvent[] {
  const events = rawBilling?.recentEvents ?? [];
  return events
    .map((event, index) => ({
      id: String(event.id ?? index),
      type: event.type ?? 'Ereignis',
      occurredAt:
        event.createdAt ??
        event.occurredAt ??
        event.timestamp ??
        new Date().toISOString(),
    }))
    .slice(0, 8);
}

function getTrialLabel(rawBilling: RawBillingSummary | null): string | undefined {
  const trialDate =
    rawBilling?.subscription?.trialEndsAt ??
    rawBilling?.subscription?.trialEnd ??
    rawBilling?.trialEndsAt;
  if (!trialDate) return undefined;
  return `Testphase bis ${formatDate(trialDate)}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    workspace: defaultWorkspace,
    planName: 'Kein Plan',
    subscriptionStatus: 'none',
    memberCount: 0,
    recentEvents: [],
    hasPartialDataError: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const token = await getAccessToken();
      if (!token) {
        router.push('/signin');
        if (!cancelled) setLoading(false);
        return;
      }

      const [workspaceRes, billingRes, teamRes] = await Promise.allSettled([
        apiRequest<RawWorkspace>({ path: '/v1/workspace/me', token }),
        apiRequest<RawBillingSummary>({ path: '/v1/billing/summary', token }),
        apiRequest<TeamMembersResponse>({ path: '/v1/team/members', token }),
      ]);

      if (cancelled) return;

      const rawWorkspace = workspaceRes.status === 'fulfilled' ? workspaceRes.value : null;
      const rawBilling = billingRes.status === 'fulfilled' ? billingRes.value : null;
      const teamMembers = teamRes.status === 'fulfilled' ? (teamRes.value.members ?? []) : [];

      setData({
        workspace: normalizeWorkspace(rawWorkspace),
        planName: rawBilling?.plan?.name ?? rawBilling?.planName ?? 'Kein Plan',
        subscriptionStatus: rawBilling?.subscription?.status ?? rawBilling?.status ?? 'none',
        trialLabel: getTrialLabel(rawBilling),
        memberCount:
          rawWorkspace?.memberCount ??
          rawBilling?.memberCount ??
          teamMembers.length ??
          0,
        recentEvents: normalizeRecentEvents(rawBilling),
        hasPartialDataError: [workspaceRes, billingRes, teamRes].some((result) => result.status === 'rejected'),
      });
      setLoading(false);
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl bg-muted/50" />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-xl bg-muted/50" />
            <div className="h-40 animate-pulse rounded-xl bg-muted/50" />
          </div>
        </div>
      </div>
    );
  }

  const statusLabel =
    data.subscriptionStatus === 'none'
      ? 'Kein Abo'
      : formatSubscriptionStatus(data.subscriptionStatus);
  const statusSubtitle =
    data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trialing'
      ? 'Aktives Abonnement'
      : undefined;

  return (
    <ModulePageTemplate
      title="Übersicht"
      description={data.workspace.name}
      badge={
        <Badge
          variant="outline"
          className="border-(--enterprise-accent)/40 bg-(--enterprise-accent-soft) font-mono text-xs text-(--enterprise-accent)"
        >
          {data.planName}
        </Badge>
      }
      topMessage={
        data.hasPartialDataError ? (
          <p className="text-sm text-muted-foreground">
            Einige Daten konnten nicht geladen werden. Es werden Fallback-Werte angezeigt.
          </p>
        ) : undefined
      }
      kpis={[
        {
          icon: Users,
          label: 'Teammitglieder',
          value: data.memberCount,
          subtitle:
            data.memberCount === 1 ? 'Person im Workspace' : 'Personen im Workspace',
        },
        {
          icon: CreditCard,
          label: 'Aktueller Plan',
          value: data.planName,
          trialLabel: data.trialLabel ?? undefined,
          accent: true,
        },
        {
          icon: ShieldCheck,
          label: 'Abo-Status',
          value: statusLabel,
          subtitle: statusSubtitle,
        },
      ]}
      mainContent={<RecentActivity events={data.recentEvents} className="h-full" />}
      sideContent={
        <div className="flex flex-col gap-4">
          <CompanyInfoCard workspace={data.workspace} />
          <QuickActions />
        </div>
      }
    />
  );
}
