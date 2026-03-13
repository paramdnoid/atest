'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronsUpDown, LogOut } from 'lucide-react';

import type { ModuleRegistryItem } from '@/lib/module-registry';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

type VisibleGroup = {
  label: string;
  items: ModuleRegistryItem[];
};

type AppSidebarProps = {
  isLoadingProfile: boolean;
  userName?: string;
  userEmail?: string;
  tenantName: string;
  trade: string;
  role: string;
  groups: VisibleGroup[];
  onSignOut: () => void;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function deriveNameFromEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const localPart = email.split('@')[0]?.trim();
  if (!localPart) return undefined;

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function AppSidebar({
  isLoadingProfile,
  userName,
  userEmail,
  tenantName,
  trade,
  role,
  groups,
  onSignOut,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const tradeLabel =
    trade === 'SHK'
      ? 'Sanitaer, Heizung, Klima'
      : trade === 'MALER'
        ? 'Maler und Tapezierer'
        : trade === 'ELEKTRO'
          ? 'Elektro'
          : tenantName;

  const userDisplayName = userName ?? deriveNameFromEmail(userEmail) ?? 'Benutzer';
  const displaySubline = tenantName || role;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-start content-center gap-2.5">
          <div
            aria-hidden="true"
            className="mb-2 h-10 w-10 shrink-0 rounded-sm bg-no-repeat self-center"
            style={{
              backgroundImage: "url('/logo.png')",
              backgroundSize: 'contain',
              backgroundPosition: 'top',
            }}
          />
          <div className="min-w-0 leading-none mt-1">
            <p className="font-display text-lg font-extrabold leading-none">
              Zunft<span className="text-primary">Gewerk</span>
            </p>
            <p className="mt-0 truncate text-sm text-muted-foreground">{isLoadingProfile ? 'Gewerk' : tradeLabel}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isLoadingProfile ? (
          <SidebarGroup>
            <div className="space-y-2 px-2">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="h-9 animate-pulse rounded-md bg-muted/70" />
              ))}
            </div>
          </SidebarGroup>
        ) : (
          groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon className={cn('size-4 transition-colors', isActive(item.href) ? 'text-primary' : 'text-muted-foreground')} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>

      <SidebarFooter>
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((open) => !open)}
            className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(userDisplayName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{userDisplayName}</p>
              <p className="truncate text-xs text-muted-foreground">{displaySubline}</p>
            </div>
            <ChevronsUpDown
              className={`ml-auto h-4 w-4 text-muted-foreground transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isUserMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-12 left-0 z-20 w-full rounded-md border bg-background p-1 shadow-md"
            >
              <div className="flex items-center gap-2 rounded-sm px-2 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                  {getInitials(userDisplayName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{userDisplayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{displaySubline}</p>
                </div>
              </div>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                role="menuitem"
                onClick={onSignOut}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-accent"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Abmelden
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
