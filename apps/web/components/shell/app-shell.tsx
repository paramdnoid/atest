'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  CAPABILITY_PROFILE_STORAGE_KEY,
  resolveCapabilityProfile,
} from '@/lib/capability-mock';
import { logoutSession } from '@/lib/auth-client';
import { loadEffectiveProfile } from '@/lib/effective-profile';
import type { EffectiveProfile } from '@/lib/effective-profile';
import { moduleRegistry } from '@/lib/module-registry';
import type { ModuleGroup } from '@/lib/module-registry';
import { clearAccessToken, getAccessToken } from '@/lib/session-token';
import { AppSidebar } from '@/components/shell/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeProfileId] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return localStorage.getItem(CAPABILITY_PROFILE_STORAGE_KEY) ?? undefined;
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<EffectiveProfile>(() => {
    const fallback = resolveCapabilityProfile();
    return {
      userName: undefined,
      userEmail: undefined,
      tenantName: fallback.tenantName,
      role: fallback.role,
      trade: fallback.trade,
      capabilities: fallback.capabilities,
      source: 'mock' as const,
    };
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token = await getAccessToken();
      if (!token) {
        router.push('/signin');
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);
      const effectiveProfile = await loadEffectiveProfile(token, activeProfileId);
      if (!cancelled) {
        setProfile(effectiveProfile);
        setIsLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [activeProfileId, router]);

  const visibleNavItems = useMemo(
    () =>
      moduleRegistry.filter((item) => {
        const hasRequiredCapabilities = item.requiredCapabilities.every((capability) =>
          profile.capabilities.includes(capability),
        );
        const isTradeVisible = !item.trades || item.trades.includes(profile.trade);
        return hasRequiredCapabilities && isTradeVisible;
      }),
    [profile.capabilities, profile.trade],
  );

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

  useEffect(() => {
    let cancelled = false;

    async function guardRoute() {
      const token = await getAccessToken();
      if (!token) {
        router.push('/signin');
        return;
      }

      if (isLoadingProfile || cancelled) {
        return;
      }

      const activeRoute = visibleNavItems.find((item) =>
        item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href),
      );
      if (!activeRoute && visibleNavItems.length > 0) {
        router.replace(visibleNavItems[0].href);
      }
    }

    guardRoute();
    return () => {
      cancelled = true;
    };
  }, [isLoadingProfile, pathname, router, visibleNavItems]);

  async function handleSignOut() {
    try {
      await logoutSession();
    } catch {
      // Always clear local auth state even if remote logout fails.
    }
    clearAccessToken();
    localStorage.removeItem(CAPABILITY_PROFILE_STORAGE_KEY);
    router.push('/signin');
    router.refresh();
  }

  return (
    <SidebarProvider>
      <AppSidebar
        isLoadingProfile={isLoadingProfile}
        userName={profile.userName}
        userEmail={profile.userEmail}
        tenantName={profile.tenantName}
        trade={profile.trade}
        role={profile.role}
        groups={visibleGroups}
        onSignOut={handleSignOut}
      />
      <SidebarInset>
        <div className="flex-1 overflow-y-auto rounded-xl border border-black/10">
          <div id="main-content" className="mx-auto w-full px-4 pb-10 pt-2 sm:px-6 sm:pt-3">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
