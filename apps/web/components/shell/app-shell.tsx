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
import { clearAccessToken, getAccessToken } from '@/lib/session-token';
import { AppSidebar } from '@/components/shell/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

const navGroups: { label: string; ids: Array<(typeof moduleRegistry)[number]['id']> }[] = [
  { label: 'Hauptmenü', ids: ['dashboard'] },
  { label: 'Verwaltung', ids: ['licenses', 'devices', 'team', 'settings'] },
];

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
      moduleRegistry.filter((item) =>
        item.requiredCapabilities.every((capability) => profile.capabilities.includes(capability)),
      ),
    [profile.capabilities],
  );

  const visibleGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          label: group.label,
          items: visibleNavItems.filter((item) => group.ids.includes(item.id)),
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

      const activeRoute = visibleNavItems.find((item) => pathname === item.href);
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
        <div className="flex-1 overflow-y-auto rounded-xl border border-black/20">
          <div id="main-content" className="mx-auto w-full px-4 pb-10 pt-2 sm:px-6 sm:pt-3">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
