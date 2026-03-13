'use client';

import { useEffect, useState } from 'react';
import { Gauge } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  applyDashboardDensity,
  DASHBOARD_DENSITY_STORAGE_KEY,
  resolveDashboardDensity,
  type DashboardDensity,
} from '@/lib/dashboard-density';

export function DashboardDensityToggle() {
  const [density, setDensity] = useState<DashboardDensity>(() => {
    if (typeof window === 'undefined') return 'comfortable';
    return resolveDashboardDensity(localStorage.getItem(DASHBOARD_DENSITY_STORAGE_KEY));
  });

  useEffect(() => {
    applyDashboardDensity(density);
  }, [density]);

  const toggleDensity = () => {
    const next: DashboardDensity = density === 'comfortable' ? 'compact' : 'comfortable';
    setDensity(next);
    applyDashboardDensity(next);
    localStorage.setItem(DASHBOARD_DENSITY_STORAGE_KEY, next);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 border-primary/25 px-2.5 text-[11px] text-primary/90 hover:text-primary"
      onClick={toggleDensity}
      title="Dichte der Dashboard-Oberfläche umschalten"
    >
      <Gauge className="h-3.5 w-3.5 text-primary" />
      {density === 'compact' ? 'Kompakt' : 'Komfort'}
    </Button>
  );
}

