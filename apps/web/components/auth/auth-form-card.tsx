'use client';

import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { FormError } from '@/components/auth/form-error';

type FooterLink = {
  href: string;
  label: string;
  prefix?: string;
};

type AuthFormCardProps = {
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  kickerLabel: string;
  error: string | null;
  footerLink?: FooterLink;
  extraFooter?: ReactNode;
};

export function AuthFormCard({
  children,
  onSubmit,
  kickerLabel,
  error,
  footerLink,
  extraFooter,
}: AuthFormCardProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="billing-editorial-main premium-noise animate-panel-enter rounded-2xl p-5 sm:p-6"
    >
      <div className="relative z-2 space-y-4">
        <span className="billing-editorial-kicker">
          <span className="billing-enterprise-kicker-dot" />
          {kickerLabel}
        </span>
        <div className="premium-divider" />

        <FormError message={error} />

        {children}

        {(footerLink || extraFooter) && <div className="premium-divider" />}

        {footerLink && (
          <p className="text-center text-sm text-muted-foreground">
            {footerLink.prefix ? `${footerLink.prefix} ` : ''}
            <Link href={footerLink.href} className="text-primary hover:underline">
              {footerLink.label}
            </Link>
          </p>
        )}
        {extraFooter}
      </div>
    </form>
  );
}
