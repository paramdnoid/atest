import { ShieldAlert, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

type PrivacyBannerProps = {
  blockingCount: number;
  warningCount: number;
};

export function PrivacyBanner({ blockingCount, warningCount }: PrivacyBannerProps) {
  if (blockingCount === 0 && warningCount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-200/60 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
        <ShieldCheck className="h-4 w-4" />
        Keine offenen DSGVO-Evidenzhinweise.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300/50 bg-amber-50/70 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
      <ShieldAlert className="h-4 w-4" />
      <span>Datenschutzhinweis: Prüfe Fotoevidenzen vor Freigabe.</span>
      {blockingCount > 0 && <Badge variant="destructive">{blockingCount} blockierend</Badge>}
      {warningCount > 0 && <Badge variant="outline">{warningCount} Hinweis</Badge>}
    </div>
  );
}
