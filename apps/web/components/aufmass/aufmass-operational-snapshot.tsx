import { AlertTriangle, CheckCheck, ClipboardClock, DraftingCompass } from 'lucide-react';

import { KpiStrip, type KpiStripItem } from '@/components/dashboard/kpi-strip';

type AufmassOperationalSnapshotProps = {
  counts: {
    draft: number;
    inReview: number;
    blocked: number;
    billed: number;
  };
};

const cards: Array<{
  key: keyof AufmassOperationalSnapshotProps['counts'];
  label: string;
  icon: KpiStripItem['icon'];
  tone: KpiStripItem['tone'];
}> = [
  {
    key: 'draft',
    label: 'Entwürfe',
    icon: DraftingCompass,
    tone: 'neutral',
  },
  {
    key: 'inReview',
    label: 'In Prüfung',
    icon: ClipboardClock,
    tone: 'amber',
  },
  {
    key: 'blocked',
    label: 'Blockiert',
    icon: AlertTriangle,
    tone: 'rose',
  },
  {
    key: 'billed',
    label: 'Abgerechnet',
    icon: CheckCheck,
    tone: 'emerald',
  },
];

export function AufmassOperationalSnapshot({ counts }: AufmassOperationalSnapshotProps) {
  const total = Math.max(1, Object.values(counts).reduce((sum, value) => sum + value, 0));
  const items: KpiStripItem[] = cards.map((card) => {
    const value = counts[card.key];
    return {
      icon: card.icon,
      label: card.label,
      value,
      subtitle: `Anteil ${Math.round((value / total) * 100)}%`,
      tone: card.tone,
      accent: card.key === 'blocked' && value > 0,
    };
  });

  return <KpiStrip items={items} />;
}
