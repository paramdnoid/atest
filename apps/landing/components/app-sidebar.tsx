"use client";

import {
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/nav-user";
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

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navGroups: { label: string; items: NavItem[] }[] = [
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
      { href: "/dashboard/employees", label: "Geräte", icon: Users },
      { href: "/dashboard/settings", label: "Einstellungen", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function AppSidebar({
  userEmail,
  userName,
  workspaceName,
}: {
  userEmail: string;
  userName?: string;
  workspaceName: string;
}) {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            ZG
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-bold tracking-tight">
              Zunft<span className="text-foreground/45">Gewerk</span>
            </span>
            <span className="mt-0.5 truncate text-[11px] text-muted-foreground">{workspaceName}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser email={userEmail} name={userName} />
      </SidebarFooter>
    </Sidebar>
  );
}
