import Link from 'next/link';
import { ArrowDownAZ, ArrowUpAZ, FilePenLine } from 'lucide-react';

import { getSemanticBadgeClass } from '@/components/dashboard/semantic-badge';
import { FormCheckbox } from '@/components/angebote/form-controls';
import { AngeboteStatusBadge } from '@/components/angebote/angebote-status-badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { getQuoteRiskLevel } from '@/lib/angebote/selectors';
import { getQuoteTotals } from '@/lib/angebote/pricing';
import type { QuoteRecord } from '@/lib/angebote/types';

type AngeboteListTableProps = {
  records: QuoteRecord[];
  allRecords: QuoteRecord[];
  selectedIds: string[];
  onToggleSelected: (id: string) => void;
  onToggleAllVisible: (checked: boolean) => void;
  visibleColumns: Array<'customer' | 'project' | 'priority' | 'owner' | 'validUntil' | 'margin' | 'totalNet'>;
  highlightedId?: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function getLevelBadgeClass(level: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  if (level === 'HIGH') {
    return getSemanticBadgeClass('danger');
  }
  if (level === 'MEDIUM') {
    return getSemanticBadgeClass('warning');
  }
  return getSemanticBadgeClass('success');
}

export function AngeboteListTable({
  records,
  allRecords,
  selectedIds,
  onToggleSelected,
  onToggleAllVisible,
  visibleColumns,
  highlightedId,
}: AngeboteListTableProps) {
  const allVisibleSelected = records.length > 0 && records.every((record) => selectedIds.includes(record.id));

  return (
    <div className="max-h-128 overflow-auto rounded-md border border-border/60">
      <Table className="min-w-305 table-auto">
        <TableHeader className="sticky top-0 z-10 bg-muted/85 backdrop-blur supports-backdrop-filter:bg-muted/75">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 px-3 py-3 text-xs font-semibold tracking-wide text-muted-foreground">
              <FormCheckbox
                checked={allVisibleSelected}
                onChange={onToggleAllVisible}
                ariaLabel="Alle sichtbaren Angebote auswaehlen"
              />
            </TableHead>
            <TableHead className="w-32.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Nummer</TableHead>
            {visibleColumns.includes('customer') && (
              <TableHead className="min-w-55 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Kunde</TableHead>
            )}
            {visibleColumns.includes('project') && (
              <TableHead className="min-w-55 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Projekt</TableHead>
            )}
            {visibleColumns.includes('priority') && (
              <TableHead className="w-27.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Prioritaet</TableHead>
            )}
            {visibleColumns.includes('owner') && (
              <TableHead className="w-37.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Verantwortlich</TableHead>
            )}
            <TableHead className="w-47.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Status</TableHead>
            {visibleColumns.includes('validUntil') && (
              <TableHead className="w-32.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Gueltig bis</TableHead>
            )}
            {visibleColumns.includes('margin') && (
              <TableHead className="w-25 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Marge</TableHead>
            )}
            {visibleColumns.includes('totalNet') && (
              <TableHead className="w-35 px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground">Netto</TableHead>
            )}
            <TableHead className="w-27.5 px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground">Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const totals = getQuoteTotals(record);
            const risk = getQuoteRiskLevel(record, allRecords);
            const isHighlighted = highlightedId === record.id;
            return (
              <TableRow
                key={record.id}
                data-state={selectedIds.includes(record.id) ? 'selected' : undefined}
                className={isHighlighted ? 'align-middle bg-primary/5 ring-1 ring-primary/25' : 'align-middle odd:bg-muted/20'}
              >
                <TableCell className="px-3 py-2">
                  <FormCheckbox
                    checked={selectedIds.includes(record.id)}
                    onChange={() => onToggleSelected(record.id)}
                    ariaLabel={`Angebot ${record.number} auswaehlen`}
                  />
                </TableCell>
                <TableCell className="px-4 py-2 font-mono text-[11px] font-semibold">
                  <Link
                    href={`/angebote/${record.id}`}
                    className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {record.number}
                  </Link>
                  {isHighlighted ? <span className="ml-2 text-[10px] font-medium text-primary">Vorschlag</span> : null}
                </TableCell>
                {visibleColumns.includes('customer') && (
                  <TableCell className="px-4 py-2 font-medium text-foreground">
                    <div className="max-w-70 truncate" title={record.customerName}>
                      {record.customerName}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes('project') && (
                  <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                    <div className="max-w-70 truncate" title={record.projectName}>
                      {record.projectName}
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes('priority') && (
                  <TableCell className="px-4 py-2">
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        getLevelBadgeClass(record.priority),
                      ].join(' ')}
                    >
                      {record.priority}
                    </span>
                  </TableCell>
                )}
                {visibleColumns.includes('owner') && (
                  <TableCell className="px-4 py-2 text-sm text-muted-foreground">{record.owner}</TableCell>
                )}
                <TableCell className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <AngeboteStatusBadge status={record.status} />
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        getLevelBadgeClass(risk),
                      ].join(' ')}
                    >
                      {risk}
                    </span>
                  </div>
                </TableCell>
                {visibleColumns.includes('validUntil') && (
                  <TableCell className="px-4 py-2 text-sm text-muted-foreground">{formatDate(record.validUntil)}</TableCell>
                )}
                {visibleColumns.includes('margin') && (
                  <TableCell className="px-4 py-2">
                    <span className={totals.marginPercent < 18 ? 'text-amber-700' : 'text-emerald-700'}>
                      {totals.marginPercent.toFixed(1)}%
                    </span>
                  </TableCell>
                )}
                {visibleColumns.includes('totalNet') && (
                  <TableCell className="px-4 py-2 text-right text-sm font-medium tabular-nums">{formatCurrency(totals.totalNet)}</TableCell>
                )}
                <TableCell className="px-4 py-2 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/angebote/${record.id}`}>
                      <FilePenLine className="h-4 w-4" />
                      Oeffnen
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function AngeboteTableSortActions({
  onSortDirectionChange,
}: {
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => onSortDirectionChange('asc')}>
        <ArrowUpAZ className="h-4 w-4" />
        Aufsteigend
      </Button>
      <Button size="sm" variant="outline" onClick={() => onSortDirectionChange('desc')}>
        <ArrowDownAZ className="h-4 w-4" />
        Absteigend
      </Button>
    </div>
  );
}
