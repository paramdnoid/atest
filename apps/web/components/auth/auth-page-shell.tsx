import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthPageShellProps = {
  children: ReactNode;
  badgeIcon: LucideIcon;
  badgeLabel: string;
  heading: string;
  subtitle?: string;
};

export function AuthPageShell({
  children,
  badgeIcon: BadgeIcon,
  badgeLabel,
  heading,
  subtitle,
}: AuthPageShellProps) {
  return (
    <section className="premium-noise auth-hero-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="enterprise-grid pointer-events-none absolute inset-0 opacity-45" />
      <main className="relative z-10 mx-auto w-full max-w-104">
        <div className="mb-6 text-center">
          <p className="font-display text-sm tracking-[0.18em] text-muted-foreground">ZUNFTGEWERK</p>
          <span className="billing-editorial-kicker mx-auto mt-3 inline-flex">
            <BadgeIcon className="h-3.5 w-3.5" />
            {badgeLabel}
          </span>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground">{heading}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>
    </section>
  );
}
