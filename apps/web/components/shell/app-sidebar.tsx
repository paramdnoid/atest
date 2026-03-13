'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-start content-center gap-2.5">
          <div
            aria-hidden="true"
            className="mb-1 h-8 w-8 shrink-0 rounded-sm bg-no-repeat self-center"
            style={{
              backgroundImage: "url('/logo.png')",
              backgroundSize: 'contain',
              backgroundPosition: 'top',
            }}
          />
          <div className="mt-1 min-w-0 leading-none">
            <p className="font-display text-base font-extrabold leading-none">
              Zunft<span className="text-primary">Gewerk</span>
            </p>
            <p className="m-0 truncate text-xs text-muted-foreground">{isLoadingProfile ? 'Gewerk' : tradeLabel}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,black_18px,black_calc(100%-18px),transparent_100%)] mask-[linear-gradient(to_bottom,transparent_0,black_18px,black_calc(100%-18px),transparent_100%)]">
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
                    <SidebarMenuButton asChild size="sm" isActive={isActive(item.href)} tooltip={item.label}>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Benutzermenü öffnen"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(userDisplayName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{userDisplayName}</p>
                <p className="truncate text-xs text-muted-foreground">{displaySubline}</p>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-[var(--radix-dropdown-menu-trigger-width)]">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
                  {getInitials(userDisplayName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{userDisplayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{displaySubline}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 shrink-0" />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
