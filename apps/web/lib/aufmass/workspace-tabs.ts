export type AufmassWorkspaceTab = 'capture' | 'review' | 'billing';

export const AUFMASS_WORKSPACE_TABS: ReadonlyArray<{
  id: AufmassWorkspaceTab;
  label: string;
}> = [
  { id: 'capture', label: 'Erfassung' },
  { id: 'review', label: 'Prüfung' },
  { id: 'billing', label: 'Abrechnung' },
];

export function getWorkspaceTabByKey(
  currentIndex: number,
  key: string,
): AufmassWorkspaceTab | null {
  if (key === 'ArrowRight' || key === 'ArrowLeft') {
    const direction = key === 'ArrowRight' ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + AUFMASS_WORKSPACE_TABS.length) %
      AUFMASS_WORKSPACE_TABS.length;
    return AUFMASS_WORKSPACE_TABS[nextIndex].id;
  }

  if (key === 'Home') {
    return AUFMASS_WORKSPACE_TABS[0].id;
  }

  if (key === 'End') {
    return AUFMASS_WORKSPACE_TABS[AUFMASS_WORKSPACE_TABS.length - 1].id;
  }

  return null;
}

export function hasReviewBadge(
  tabId: AufmassWorkspaceTab,
  reviewBadge: number,
): boolean {
  return tabId === 'review' && reviewBadge > 0;
}

export function getTabAriaLabel(
  tabId: AufmassWorkspaceTab,
  tabLabel: string,
  reviewBadge: number,
): string {
  if (!hasReviewBadge(tabId, reviewBadge)) {
    return tabLabel;
  }

  return `${tabLabel}, ${reviewBadge} offene Prüfblocker`;
}

export function getReviewBadgeLabel(reviewBadge: number): string {
  return `${reviewBadge} offene Prüfblocker`;
}
