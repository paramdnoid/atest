import { Suspense, type ReactNode } from 'react';
import { AppShell } from '@/components/shell/app-shell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" aria-hidden />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
