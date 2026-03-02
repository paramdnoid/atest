import {
  Activity,
  CreditCard,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import { formatDate } from "@/lib/format";

type SubscriptionEvent = {
  id: string;
  type: string;
  occurredAt: Date | string;
};

type EventConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
};

const eventConfig: Record<string, EventConfig> = {
  "customer.subscription.created": {
    label: "Abonnement erstellt",
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  "customer.subscription.updated": {
    label: "Abonnement aktualisiert",
    icon: TrendingUp,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  "customer.subscription.deleted": {
    label: "Abonnement gekündigt",
    icon: TrendingDown,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  "invoice.paid": {
    label: "Rechnung bezahlt",
    icon: CreditCard,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  "invoice.payment_failed": {
    label: "Zahlung fehlgeschlagen",
    icon: CreditCard,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  "checkout.session.completed": {
    label: "Checkout abgeschlossen",
    icon: ShoppingCart,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
};

function getEventConfig(type: string): EventConfig {
  return (
    eventConfig[type] ?? {
      label: type.replace(/\./g, " › "),
      icon: Activity,
      color: "text-muted-foreground",
      bg: "bg-muted",
    }
  );
}

export function RecentActivity({ events, className }: { events: SubscriptionEvent[]; className?: string }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-border bg-sidebar/40${className ? ` ${className}` : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_2px_8px_color-mix(in_oklch,var(--color-primary)_40%,transparent)]">
          <Activity className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Aktivitäten
          </p>
          <p className="text-sm font-semibold leading-tight">Letzte Ereignisse</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted">
              <Activity className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Keine Aktivitäten</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Ereignisse erscheinen hier automatisch.
            </p>
          </div>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />
            {events.map((event, idx) => {
              const config = getEventConfig(event.type);
              const Icon = config.icon;
              const isLast = idx === events.length - 1;
              return (
                <div
                  key={event.id}
                  className={`relative flex gap-4 ${isLast ? "pb-0" : "pb-4"}`}
                >
                  <div
                    className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-border ${config.bg}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-3 pt-0.5">
                    <p className="text-sm font-medium leading-snug">{config.label}</p>
                    <time className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {formatDate(event.occurredAt)}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
