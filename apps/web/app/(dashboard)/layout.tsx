import type { ReactNode } from 'react';
import { SidebarNav } from './_nav';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-56 flex-col border-r border-border bg-card">
        <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
          <span className="text-sm font-semibold tracking-tight">Zunftgewerk</span>
        </div>
        <SidebarNav />
      </aside>

      <main className="ml-56 min-w-0 flex-1">{children}</main>
    </div>
  );
}
