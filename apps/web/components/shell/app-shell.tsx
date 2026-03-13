'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CAPABILITY_PROFILE_STORAGE_KEY } from '@/lib/capability-mock';
import { logoutSession } from '@/lib/auth-client';
import { loadEffectiveProfile } from '@/lib/effective-profile';
import type { EffectiveProfile } from '@/lib/effective-profile';
import { moduleRegistry } from '@/lib/module-registry';
import type { ModuleGroup } from '@/lib/module-registry';
import { clearAccessToken, getAccessToken } from '@/lib/session-token';
import { AppSidebar } from '@/components/shell/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
const CAPABILITY_MOCK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CAPABILITY_MOCK === 'true';

type ShellPhase = 'loading' | 'ready' | 'unauthenticated' | 'error';

type ShellState = {
  phase: ShellPhase;
  profile: EffectiveProfile | null;
};

const groupOrder: ModuleGroup[] = [
  'hauptmenue',
  'auftragsabwicklung',
  'betrieb',
  'finanzen',
  'verwaltung',
];

const groupLabels: Record<ModuleGroup, string> = {
  hauptmenue: 'Hauptmenü',
  auftragsabwicklung: 'Auftragsabwicklung',
  betrieb: 'Betrieb',
  finanzen: 'Finanzen',
  verwaltung: 'Verwaltung',
};

function ShellContentSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <div className="h-8 w-52 animate-pulse rounded-md bg-muted/70" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border border-border/70 bg-muted/40" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
        <div className="h-72 animate-pulse rounded-lg border border-border/70 bg-muted/40" />
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-lg border border-border/70 bg-muted/40" />
          <div className="h-32 animate-pulse rounded-lg border border-border/70 bg-muted/40" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeProfileId] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    if (!CAPABILITY_MOCK_ENABLED) return undefined;
    return localStorage.getItem(CAPABILITY_PROFILE_STORAGE_KEY) ?? undefined;
  });
  const [state, setState] = useState<ShellState>({ phase: 'loading', profile: null });

  useEffect(() => {
    let cancelled = false;

    async function resolveShellState() {
      setState((prev) => ({ ...prev, phase: 'loading' }));
      const token = await getAccessToken();
      if (!token) {
        if (cancelled) return;
        setState({ phase: 'unauthenticated', profile: null });
        return;
      }

      try {
        const effectiveProfile = await loadEffectiveProfile(token, activeProfileId);
        if (cancelled) return;
        setState({ phase: 'ready', profile: effectiveProfile });
      } catch {
        if (cancelled) return;
        clearAccessToken();
        setState({ phase: 'error', profile: null });
      }
    }

    resolveShellState();
    return () => {
      cancelled = true;
    };
  }, [activeProfileId]);

  useEffect(() => {
    if (state.phase === 'unauthenticated' || state.phase === 'error') {
      router.replace('/signin');
    }
  }, [router, state.phase]);

  const isLoadingProfile = state.phase === 'loading';
  const profile = state.profile;

  const visibleNavItems = useMemo(() => {
    if (!profile) return [];
    return moduleRegistry.filter((item) => {
      const hasRequiredCapabilities = item.requiredCapabilities.every((capability) =>
        profile.capabilities.includes(capability),
      );
      const isTradeVisible = !item.trades || item.trades.includes(profile.trade);
      return hasRequiredCapabilities && isTradeVisible;
    });
  }, [profile]);

  const visibleGroups = useMemo(
    () =>
      groupOrder
        .map((group) => ({
          label: groupLabels[group],
          items: visibleNavItems.filter((item) => item.group === group),
        }))
        .filter((group) => group.items.length > 0),
    [visibleNavItems],
  );
  const hasVisibleModules = visibleNavItems.length > 0;

  useEffect(() => {
    if (state.phase !== 'ready' || !profile) {
      return;
    }

    const activeRoute = visibleNavItems.find((item) =>
      item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href),
    );
    if (!activeRoute && visibleNavItems.length > 0) {
      router.replace(visibleNavItems[0].href);
    }
  }, [pathname, profile, router, state.phase, visibleNavItems]);

  async function handleSignOut() {
    try {
      await logoutSession();
    } catch {
      // Always clear local auth state even if remote logout fails.
    }
    clearAccessToken();
    if (CAPABILITY_MOCK_ENABLED) {
      localStorage.removeItem(CAPABILITY_PROFILE_STORAGE_KEY);
    }
    router.push('/signin');
    router.refresh();
  }

  return (
    <SidebarProvider>
      <AppSidebar
        isLoadingProfile={isLoadingProfile}
        userName={profile?.userName}
        userEmail={profile?.userEmail}
        tenantName={profile?.tenantName ?? ''}
        trade={profile?.trade ?? ''}
        role={profile?.role ?? ''}
        groups={visibleGroups}
        onSignOut={handleSignOut}
      />
      <SidebarInset>
        <div className="flex-1 overflow-y-auto rounded-lg border border-border/70 bg-background/70">
          <div id="main-content" className="mx-auto w-full px-4 pb-10 pt-2 sm:px-6 sm:pt-3">
            {isLoadingProfile ? (
              <ShellContentSkeleton />
            ) : !profile ? (
              null
            ) : hasVisibleModules ? (
              children
            ) : (
              <div className="rounded-lg border border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                Keine Module für dieses Profil verfügbar. Bitte Rollen-/Berechtigungskonfiguration prüfen.
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
