import Link from 'next/link';
import { Link2 } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Button } from '@/components/ui/button';
import {
  getHandoffActions,
  type VerknuepfungsKontext,
  type VerknuepfungsSnapshot,
} from '@/lib/auftragsabwicklung/cross-module-intelligence';

const moduleLabel: Record<string, string> = {
  KUNDEN: 'Kunden & Objekte',
  AUFMASS: 'Aufmaß',
  ANGEBOTE: 'Angebote & Aufträge',
  ABNAHMEN: 'Abnahmen & Mängel',
};

function targetModuleFromHref(href: string): string | null {
  if (href.startsWith('/kunden')) return 'KUNDEN';
  if (href.startsWith('/aufmass')) return 'AUFMASS';
  if (href.startsWith('/angebote')) return 'ANGEBOTE';
  if (href.startsWith('/abnahmen')) return 'ABNAHMEN';
  return null;
}

function withSuggestion(href: string, suggestionId?: string): string {
  if (!suggestionId) return href;
  const divider = href.includes('?') ? '&' : '?';
  return `${href}${divider}handoffSuggestionId=${encodeURIComponent(suggestionId)}`;
}

function confidenceClass(confidence: number): string {
  if (confidence >= 70) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700';
  if (confidence >= 45) return 'border-amber-500/40 bg-amber-500/10 text-amber-700';
  return 'border-border/60 bg-background/60 text-muted-foreground';
}

export function CrossModuleLinksCard({
  snapshot,
  context,
  title = 'Modulübergreifende Verknüpfung',
}: {
  snapshot: VerknuepfungsSnapshot;
  context: VerknuepfungsKontext;
  title?: string;
}) {
  const handoffActions = getHandoffActions(context);
  return (
    <ModuleTableCard icon={Link2} label="Prozessgraph" title={title} hasData>
      <CrossModuleLinksContent snapshot={snapshot} context={context} />
    </ModuleTableCard>
  );
}

export function CrossModuleLinksContent({
  snapshot,
  context,
}: {
  snapshot: VerknuepfungsSnapshot;
  context: VerknuepfungsKontext;
}) {
  const handoffActions = getHandoffActions(context);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="rounded-md border border-border/60 bg-background/60 px-2.5 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Verknüpfungsgrad</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{snapshot.processCoverage}%</p>
        </div>
        <div className="rounded-md border border-border/60 bg-background/60 px-2.5 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Ø Confidence</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{snapshot.confidenceAverage}%</p>
        </div>
      </div>

      {snapshot.related.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Es wurden noch keine belastbaren Querverbindungen zu anderen Modulen erkannt.
        </p>
      ) : (
        <div className="space-y-2">
          {snapshot.related.slice(0, 4).map((entry) => (
            <Link
              key={`${entry.module}-${entry.id}`}
              href={entry.href}
              className="block rounded-md border border-border/70 bg-background/60 px-3 py-2 transition-colors hover:bg-background"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                    {moduleLabel[entry.module] ?? entry.module}
                  </p>
                  <p className="text-sm font-medium text-foreground">{entry.label}</p>
                  <p className="text-xs text-muted-foreground">{entry.subtitle}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${confidenceClass(entry.confidence)}`}>
                  {entry.confidence}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {snapshot.suggestions.length > 0 ? (
        <div className="rounded-md border border-border/70 bg-sidebar/20 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Empfohlene nächste Schritte</p>
          <div className="mt-1 space-y-1 text-xs text-muted-foreground">
            {snapshot.suggestions.map((item) => (
              <p key={item}>- {item}</p>
            ))}
          </div>
        </div>
      ) : null}

      {handoffActions.length > 0 ? (
        <div className="space-y-2 rounded-md border border-border/70 bg-background/70 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Schnellaktionen</p>
          <div className="flex flex-wrap gap-2">
            {handoffActions.map((action) => {
              const targetModule = targetModuleFromHref(action.href);
              const bestMatch = snapshot.related.find((entry) => entry.module === targetModule);
              const href = withSuggestion(action.href, bestMatch?.id);
              return (
                <Button key={action.id} size="sm" variant="outline" asChild>
                  <Link href={href}>{action.label}</Link>
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
