import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, FilePenLine, Workflow } from 'lucide-react';

import { getSemanticBadgeClass } from '@/components/dashboard/semantic-badge';
import { FormCheckbox } from '@/components/angebote/form-controls';
import { AngeboteStatusBadge } from '@/components/angebote/angebote-status-badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { getQuoteTotals } from '@/lib/angebote/pricing';
import type { QuoteRecord } from '@/lib/angebote/types';

type AngeboteListTableProps = {
  records: QuoteRecord[];
  totalEntries: number;
  isSearchActive: boolean;
  selectedIds: string[];
  onToggleSelected: (id: string) => void;
  onToggleAllVisible: (checked: boolean, visibleIds: string[]) => void;
  onRunBatchReadyForReview: () => void;
  visibleColumns: Array<'customer' | 'project' | 'priority' | 'owner' | 'validUntil' | 'margin' | 'totalNet'>;
  highlightedId?: string;
};

type SortField =
  | 'number'
  | 'customer'
  | 'project'
  | 'priority'
  | 'owner'
  | 'status'
  | 'validUntil'
  | 'margin'
  | 'totalNet';
type SortDirection = 'asc' | 'desc';

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
  totalEntries,
  isSearchActive,
  selectedIds,
  onToggleSelected,
  onToggleAllVisible,
  onRunBatchReadyForReview,
  visibleColumns,
  highlightedId,
}: AngeboteListTableProps) {
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const sortedRecords = useMemo(() => {
    const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
    const priorityWeight: Record<QuoteRecord['priority'], number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };

    return [...records].sort((left, right) => {
      let compare = 0;
      switch (sortField) {
        case 'number':
          compare = collator.compare(left.number, right.number);
          break;
        case 'customer':
          compare = collator.compare(left.customerName, right.customerName);
          break;
        case 'project':
          compare = collator.compare(left.projectName, right.projectName);
          break;
        case 'priority':
          compare = priorityWeight[left.priority] - priorityWeight[right.priority];
          break;
        case 'owner':
          compare = collator.compare(left.owner, right.owner);
          break;
        case 'status':
          compare = collator.compare(left.status, right.status);
          break;
        case 'validUntil':
          compare = new Date(left.validUntil).getTime() - new Date(right.validUntil).getTime();
          break;
        case 'margin':
          compare = getQuoteTotals(left).marginPercent - getQuoteTotals(right).marginPercent;
          break;
        case 'totalNet':
          compare = getQuoteTotals(left).totalNet - getQuoteTotals(right).totalNet;
          break;
      }
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [records, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = useMemo(
    () => sortedRecords.slice((safePage - 1) * pageSize, safePage * pageSize),
    [safePage, sortedRecords],
  );
  const visibleIds = useMemo(() => pagedRecords.map((record) => record.id), [pagedRecords]);
  const allVisibleSelected =
    pagedRecords.length > 0 && pagedRecords.every((record) => selectedIds.includes(record.id));

  useEffect(() => {
    setPage(1);
  }, [records, sortDirection, sortField]);

  const toggleSort = (nextField: SortField) => {
    if (sortField === nextField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(nextField);
    setSortDirection('asc');
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/80" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    );
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 hover:text-foreground dark:text-slate-300"
      aria-label={`${label} sortieren`}
    >
      {label}
      <SortIcon field={field} />
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="max-h-128 overflow-auto rounded-xl border border-border/60 bg-background/80">
        <Table className="min-w-305 table-auto">
          <TableHeader className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur supports-backdrop-filter:bg-slate-100/95 dark:bg-slate-900/95">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 px-3 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground">
                <FormCheckbox
                  checked={allVisibleSelected}
                  onChange={(checked) => onToggleAllVisible(checked, visibleIds)}
                  ariaLabel="Alle sichtbaren Angebote auswaehlen"
                />
              </TableHead>
              <TableHead className="w-32.5 px-3 py-2.5">
                <SortButton field="number" label="Nummer" />
              </TableHead>
              {visibleColumns.includes('customer') && (
                <TableHead className="min-w-55 px-3 py-2.5">
                  <SortButton field="customer" label="Kunde" />
                </TableHead>
              )}
              {visibleColumns.includes('project') && (
                <TableHead className="min-w-55 px-3 py-2.5">
                  <SortButton field="project" label="Projekt" />
                </TableHead>
              )}
              {visibleColumns.includes('priority') && (
                <TableHead className="w-27.5 px-3 py-2.5">
                  <SortButton field="priority" label="Prioritaet" />
                </TableHead>
              )}
              {visibleColumns.includes('owner') && (
                <TableHead className="w-37.5 px-3 py-2.5">
                  <SortButton field="owner" label="Verantwortlich" />
                </TableHead>
              )}
              <TableHead className="w-47.5 px-3 py-2.5">
                <SortButton field="status" label="Status" />
              </TableHead>
              {visibleColumns.includes('validUntil') && (
                <TableHead className="w-32.5 px-3 py-2.5">
                  <SortButton field="validUntil" label="Gueltig bis" />
                </TableHead>
              )}
              {visibleColumns.includes('margin') && (
                <TableHead className="w-25 px-3 py-2.5">
                  <SortButton field="margin" label="Marge" />
                </TableHead>
              )}
              {visibleColumns.includes('totalNet') && (
                <TableHead className="w-35 px-3 py-2.5 text-right">
                  <SortButton field="totalNet" label="Netto" />
                </TableHead>
              )}
              <TableHead className="w-27.5 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRecords.map((record) => {
              const totals = getQuoteTotals(record);
              const isHighlighted = highlightedId === record.id;
              return (
                <TableRow
                  key={record.id}
                  data-state={selectedIds.includes(record.id) ? 'selected' : undefined}
                  className={
                    selectedIds.includes(record.id)
                      ? 'cursor-pointer align-middle bg-muted/55 ring-1 ring-border/80'
                      : isHighlighted
                        ? 'cursor-pointer align-middle bg-muted/40 ring-1 ring-border/60'
                        : 'cursor-pointer align-middle odd:bg-slate-50/40 hover:bg-slate-100/60 dark:odd:bg-slate-900/30 dark:hover:bg-slate-800/45'
                  }
                >
                  <TableCell className="px-3 py-2">
                    <FormCheckbox
                      checked={selectedIds.includes(record.id)}
                      onChange={() => onToggleSelected(record.id)}
                      ariaLabel={`Angebot ${record.number} auswaehlen`}
                    />
                  </TableCell>
                  <TableCell className="px-3 py-2 font-mono text-[11px] font-semibold">
                    <Link
                      href={`/angebote/${record.id}`}
                      className="text-primary/95 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {record.number}
                    </Link>
                    {isHighlighted ? <span className="ml-2 text-[10px] font-medium text-primary">Vorschlag</span> : null}
                  </TableCell>
                  {visibleColumns.includes('customer') && (
                    <TableCell className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                      <div className="max-w-70 truncate" title={record.customerName}>
                        {record.customerName}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.includes('project') && (
                    <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                      <div className="max-w-70 truncate" title={record.projectName}>
                        {record.projectName}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.includes('priority') && (
                    <TableCell className="px-3 py-2">
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
                    <TableCell className="px-3 py-2 text-sm text-muted-foreground">{record.owner}</TableCell>
                  )}
                  <TableCell className="px-3 py-2">
                    <AngeboteStatusBadge status={record.status} />
                  </TableCell>
                  {visibleColumns.includes('validUntil') && (
                    <TableCell className="px-3 py-2 text-sm text-muted-foreground">{formatDate(record.validUntil)}</TableCell>
                  )}
                  {visibleColumns.includes('margin') && (
                    <TableCell className="px-3 py-2">
                      <span className={totals.marginPercent < 18 ? 'text-amber-700' : 'text-emerald-700'}>
                        {totals.marginPercent.toFixed(1)}%
                      </span>
                    </TableCell>
                  )}
                  {visibleColumns.includes('totalNet') && (
                    <TableCell className="px-3 py-2 text-right text-sm font-medium tabular-nums">{formatCurrency(totals.totalNet)}</TableCell>
                  )}
                  <TableCell className="px-3 py-2 text-right">
                    <Button
                      asChild
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-md border-border/70 bg-background/90"
                    >
                      <Link href={`/angebote/${record.id}`} aria-label="Angebot oeffnen">
                        <FilePenLine className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            {records.length} {isSearchActive ? 'Treffer' : 'Einträge'} · {selectedIds.length} markiert
          </span>
          <span>
            Seite {safePage} von {totalPages}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {selectedIds.length > 0 ? (
            <Button size="sm" className="h-7 min-w-43" onClick={onRunBatchReadyForReview}>
              <Workflow className="h-4 w-4" />
              {selectedIds.length} zur Pruefung
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-7 min-w-43" disabled>
              <Workflow className="h-4 w-4" />
              Batch zur Pruefung
            </Button>
          )}
          <Button
            size="sm"
            variant="default"
            disabled={safePage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Zurück
          </Button>
          <Button
            size="sm"
            variant="default"
            disabled={safePage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Weiter
          </Button>
        </div>
      </div>
    </div>
  );
}
