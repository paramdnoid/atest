import type { LucideIcon } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { FadeIn } from "@/components/fade-in";
import { GlowBackground } from "@/components/glow-background";
import { SectionBadge } from "@/components/section-badge";

type AuthPageShellProps = {
  children: React.ReactNode;
  badgeIcon: LucideIcon;
  badgeLabel: string;
  heading: string;
  subtitle?: string;
};

export function AuthPageShell({
  children,
  badgeIcon,
  badgeLabel,
  heading,
  subtitle,
}: AuthPageShellProps) {
  return (
    <section className="premium-noise relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="enterprise-grid pointer-events-none absolute inset-0 opacity-45" />
      <div aria-hidden className="bg-dot-pattern pointer-events-none absolute inset-0 opacity-[0.07]" />
      <GlowBackground variant="centered" />

      <main className="relative mx-auto w-full max-w-[26rem]">
        <FadeIn className="mb-8 flex justify-center">
          <BrandLogo />
        </FadeIn>

        <FadeIn delay={0.05} className="mb-6 text-center">
          <SectionBadge icon={badgeIcon}>{badgeLabel}</SectionBadge>
          <h1 className="hero-text-gloss font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {heading}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {subtitle}
            </p>
          )}
        </FadeIn>

        <FadeIn delay={0.1}>
          {children}
        </FadeIn>
      </main>
    </section>
  );
}
