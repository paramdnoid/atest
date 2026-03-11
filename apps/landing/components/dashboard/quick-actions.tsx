import { ArrowRight, CreditCard, Settings, Users, Zap } from "lucide-react";
import Link from "next/link";

import {
  DashboardCard,
  DashboardCardHeader,
} from "@/components/dashboard/dashboard-card";
import { cn } from "@/lib/utils";

type QuickAction = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
};

const actions: QuickAction[] = [
  {
    href: "/dashboard/employees",
    title: "Team & Lizenzen",
    description: "Benutzerlizenzen verwalten",
    icon: Users,
    accent: true,
  },
  {
    href: "/dashboard/billing",
    title: "Abrechnung",
    description: "Plan & Rechnungen",
    icon: CreditCard,
  },
  {
    href: "/dashboard/settings",
    title: "Einstellungen",
    description: "Workspace konfigurieren",
    icon: Settings,
  },
];

export function QuickActions() {
  return (
    <DashboardCard>
      <DashboardCardHeader icon={Zap} label="Navigation" title="Schnellzugriff" />

      <div className="grid grid-cols-2 gap-1.5 p-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group relative flex flex-col gap-2 overflow-hidden rounded-lg border p-3 transition-all duration-200",
                "hover:-translate-y-px",
                action.accent
                  ? ["border-primary/30 bg-primary/8", "hover:border-primary/50 hover:bg-primary/12"]
                  : ["border-border bg-sidebar/40", "hover:border-primary/20 hover:bg-sidebar/40"],
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                  action.accent
                    ? "bg-primary text-primary-foreground shadow-[0_2px_8px_color-mix(in_oklch,var(--color-primary)_40%,transparent)]"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className={cn("text-sm font-semibold leading-none", action.accent && "text-primary")}>
                  {action.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight
                className={cn(
                  "absolute right-3 top-3 h-3.5 w-3.5 transition-all duration-200 group-hover:translate-x-0.5",
                  action.accent
                    ? "text-primary/40 group-hover:text-primary/70"
                    : "text-muted-foreground/30 group-hover:text-muted-foreground/60",
                )}
              />
            </Link>
          );
        })}
      </div>
    </DashboardCard>
  );
}
