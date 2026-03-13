export const DASHBOARD_DENSITY_STORAGE_KEY = 'zg_dashboard_density';

export type DashboardDensity = 'comfortable' | 'compact';

export function resolveDashboardDensity(value: string | null | undefined): DashboardDensity {
  return value === 'compact' ? 'compact' : 'comfortable';
}

export function applyDashboardDensity(density: DashboardDensity): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.dashboardDensity = density;
}

