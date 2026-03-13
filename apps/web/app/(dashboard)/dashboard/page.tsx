'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, ShieldCheck, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/session-token';
import { expectRecord, optionalArray, optionalNumber, optionalString } from '@/lib/validation';
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

function parseWorkspacePayload(payload: unknown): RawWorkspace {
  const record = expectRecord(payload, 'Workspace-Profil');
  return {
    tenantId: optionalString(record.tenantId),
    id: optionalString(record.id),
    workspaceName: optionalString(record.workspaceName),
    name: optionalString(record.name),
    tradeName: optionalString(record.tradeName),
    email: optionalString(record.email),
    role: optionalString(record.role),
    memberCount: optionalNumber(record.memberCount),
    addressLine1: optionalString(record.addressLine1) ?? null,
    addressLine2: optionalString(record.addressLine2) ?? null,
    postalCode: optionalString(record.postalCode) ?? null,
    city: optionalString(record.city) ?? null,
    countryCode: optionalString(record.countryCode) ?? null,
    latitude: optionalNumber(record.latitude) ?? null,
    longitude: optionalNumber(record.longitude) ?? null,
    address_line_1: optionalString(record.address_line_1) ?? null,
    address_line_2: optionalString(record.address_line_2) ?? null,
    postal_code: optionalString(record.postal_code) ?? null,
    country_code: optionalString(record.country_code) ?? null,
    latitude_deg: optionalNumber(record.latitude_deg) ?? null,
    longitude_deg: optionalNumber(record.longitude_deg) ?? null,
  };
}

function parseBillingSummary(payload: unknown): RawBillingSummary {
  const record = expectRecord(payload, 'Billing-Zusammenfassung');
  const plan = typeof record.plan === 'object' && record.plan !== null
    ? { name: optionalString((record.plan as Record<string, unknown>).name) ?? null }
    : null;
  const subscription = typeof record.subscription === 'object' && record.subscription !== null
    ? {
        status: optionalString((record.subscription as Record<string, unknown>).status) ?? null,
        trialEndsAt: optionalString((record.subscription as Record<string, unknown>).trialEndsAt) ?? null,
        trialEnd: optionalString((record.subscription as Record<string, unknown>).trialEnd) ?? null,
        currentPeriodEnd: optionalString((record.subscription as Record<string, unknown>).currentPeriodEnd) ?? null,
      }
    : null;

  return {
    planName: optionalString(record.planName) ?? null,
    status: optionalString(record.status) ?? null,
    trialEndsAt: optionalString(record.trialEndsAt) ?? null,
    currentPeriodEnd: optionalString(record.currentPeriodEnd) ?? null,
    memberCount: optionalNumber(record.memberCount),
    plan,
    subscription,
    recentEvents: optionalArray(record.recentEvents, (entry, index) => {
      const event = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : null;
      if (!event) return null;
      return {
        id: optionalString(event.id) ?? String(index),
        type: optionalString(event.type),
        createdAt: optionalString(event.createdAt),
        occurredAt: optionalString(event.occurredAt),
        timestamp: optionalString(event.timestamp),
      };
    }),
  };
}

function parseTeamMembers(payload: unknown): TeamMembersResponse {
  const record = expectRecord(payload, 'Team-Mitglieder');
  return {
    members: optionalArray(record.members, (entry) => {
      const member = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : null;
      if (!member) return null;
      return {
        userId: optionalString(member.userId),
        tradeName: optionalString(member.tradeName),
      };
    }),
  };
}

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
        apiRequest<RawWorkspace>({ path: '/v1/workspace/me', token, validate: parseWorkspacePayload }),
        apiRequest<RawBillingSummary>({ path: '/v1/billing/summary', token, validate: parseBillingSummary }),
        apiRequest<TeamMembersResponse>({ path: '/v1/team/members', token, validate: parseTeamMembers }),
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
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-lg bg-muted/50" />
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
            <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
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
        <Badge variant="outline" className="dashboard-module-badge">
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
          tone: 'blue',
        },
        {
          icon: CreditCard,
          label: 'Aktueller Plan',
          value: data.planName,
          trialLabel: data.trialLabel ?? undefined,
          accent: true,
          tone: 'primary',
        },
        {
          icon: ShieldCheck,
          label: 'Abo-Status',
          value: statusLabel,
          subtitle: statusSubtitle,
          tone: 'emerald',
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
