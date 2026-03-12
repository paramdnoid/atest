"use client";

import {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
} from "@/components/ui/sidebar";

const NavUser = dynamic(
  () => import("@/components/nav-user").then((module) => module.NavUser),
  {
    loading: () => <div className="mx-2 mb-2 h-10 rounded-md bg-muted/40" />,
  },
);

type SidebarIcon = React.ComponentType<{ className?: string }>;

export type NavItem = {
  href: string;
  label: string;
  icon: SidebarIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const defaultNavGroups: NavGroup[] = [
  {
    label: "Hauptmenü",
    items: [
      { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
    ],
  },
  {
    label: "Verwaltung",
    items: [
      { href: "/dashboard/billing", label: "Abrechnung", icon: CreditCard },
      { href: "/dashboard/employees", label: "Team & Lizenzen", icon: Users },
      { href: "/dashboard/settings", label: "Einstellungen", icon: Settings },
    ],
  },
];

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

const SidebarBrand = memo(function SidebarBrand({ workspaceName }: { workspaceName: string }) {
  return (
    <SidebarHeader className="px-3 py-3">
      <div className="flex items-center gap-2.5">
        <Image
          src="/logo.png"
          alt=""
          role="presentation"
          width={28}
          height={28}
          className="shrink-0 object-contain"
        />
        <div className="flex flex-col leading-none">
          <span className="font-display text-sm font-bold uppercase tracking-tight">
            Zunft<span className="text-primary">Gewerk</span>
          </span>
          <span className="mt-0 truncate text-[11px] text-muted-foreground">{workspaceName}</span>
        </div>
      </div>
    </SidebarHeader>
  );
});

type NavigationGroupProps = {
  group: NavGroup;
  pathname: string;
  virtualizeAfter: number;
};

const VIRTUAL_ROW_HEIGHT = 36;
const VIRTUAL_CONTAINER_HEIGHT = 256;
const VIRTUAL_OVERSCAN = 3;

const VirtualizedSidebarMenu = memo(function VirtualizedSidebarMenu({
  items,
  isItemActive,
}: {
  items: NavItem[];
  isItemActive: (href: string) => boolean;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const rafRef = useRef<number | null>(null);
  const latestScrollTopRef = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleScroll = useCallback((nextScrollTop: number) => {
    latestScrollTopRef.current = nextScrollTop;
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      startTransition(() => {
        setScrollTop(latestScrollTopRef.current);
      });
    });
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
  const visibleCount =
    Math.ceil(VIRTUAL_CONTAINER_HEIGHT / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = items.slice(startIndex, endIndex);
  const topSpacerHeight = startIndex * VIRTUAL_ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(0, (items.length - endIndex) * VIRTUAL_ROW_HEIGHT);

  return (
    <div
      className="max-h-64 overflow-y-auto"
      onScroll={(event) => handleScroll(event.currentTarget.scrollTop)}
    >
      <SidebarMenu>
        {topSpacerHeight > 0 ? (
          <li aria-hidden="true" style={{ height: topSpacerHeight }} />
        ) : null}
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={isItemActive(item.href)} tooltip={item.label}>
              <Link href={item.href}>
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {bottomSpacerHeight > 0 ? (
          <li aria-hidden="true" style={{ height: bottomSpacerHeight }} />
        ) : null}
      </SidebarMenu>
    </div>
  );
});

const NavigationGroup = memo(function NavigationGroup({
  group,
  pathname,
  virtualizeAfter,
}: NavigationGroupProps) {
  const activeByHref = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of group.items) {
      map.set(item.href, isRouteActive(pathname, item.href));
    }
    return map;
  }, [group.items, pathname]);

  const isItemActive = useCallback(
    (href: string) => activeByHref.get(href) === true,
    [activeByHref],
  );
  const shouldVirtualize = group.items.length >= virtualizeAfter;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      {shouldVirtualize ? (
        <VirtualizedSidebarMenu items={group.items} isItemActive={isItemActive} />
      ) : (
        <SidebarMenu>
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isItemActive(item.href)} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      )}
    </SidebarGroup>
  );
});

export type AppSidebarProps = {
  userEmail: string;
  userName?: string;
  workspaceName: string;
  navGroups?: NavGroup[];
  virtualizeAfter?: number;
};

export function AppSidebar({
  userEmail,
  userName,
  workspaceName,
  navGroups = defaultNavGroups,
  virtualizeAfter = 30,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset">
      <SidebarBrand workspaceName={workspaceName} />

      <SidebarContent>
        {navGroups.map((group) => (
          <NavigationGroup
            key={group.label}
            group={group}
            pathname={pathname}
            virtualizeAfter={virtualizeAfter}
          />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser email={userEmail} name={userName} />
      </SidebarFooter>
    </Sidebar>
  );
}
