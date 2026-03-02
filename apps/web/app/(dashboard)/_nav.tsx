'use client';

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Key, LayoutDashboard, LogOut, Monitor, Settings, Users } from 'lucide-react';
import type { Route } from 'next';
import { cn } from '@/lib/utils';

const navItems: Array<{ href: Route<string>; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { href: '/dashboard' as Route<string>, label: 'Übersicht', icon: LayoutDashboard },
  { href: '/licenses' as Route<string>, label: 'Lizenzen', icon: Key },
  { href: '/devices' as Route<string>, label: 'Geräte', icon: Monitor },
  { href: '/team' as Route<string>, label: 'Team', icon: Users },
  { href: '/settings' as Route<string>, label: 'Einstellungen', icon: Settings },
];

function handleSignOut() {
  localStorage.removeItem('zg_access_token');
  window.location.href = '/signin';
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="flex-1 space-y-0.5 px-2 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Abmelden
        </button>
      </div>
    </>
  );
}
