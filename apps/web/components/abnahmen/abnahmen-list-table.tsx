import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, FilePenLine } from 'lucide-react';

import { AbnahmenStatusBadge } from '@/components/abnahmen/abnahmen-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import type { AbnahmeRecord } from '@/lib/abnahmen/types';
import { getOpenDefectsBySeverity } from '@/lib/abnahmen/selectors';

type SortField = 'number' | 'projectName' | 'customerName' | 'status' | 'critical' | 'nextInspectionDate' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/80" />;
  return sortDirection === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

function SortButton({
  field,
  label,
  sortField,
  sortDirection,
  onSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 hover:text-foreground dark:text-slate-300"
      aria-label={`${label} sortieren`}
    >
      {label}
      <SortIcon field={field} sortField={sortField} sortDirection={sortDirection} />
    </button>
  );
}

export function AbnahmenListTable({
  records,
  totalEntries,
  isSearchActive,
  highlightedId,
}: {
  records: AbnahmeRecord[];
  totalEntries: number;
  isSearchActive: boolean;
  highlightedId?: string;
}) {
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const pageSize = 25;

  const sortedRecords = useMemo(() => {
    const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
    return [...records].sort((left, right) => {
      let compare = 0;
      switch (sortField) {
        case 'number':
          compare = collator.compare(left.number, right.number);
          break;
        case 'projectName':
          compare = collator.compare(left.projectName, right.projectName);
          break;
        case 'customerName':
          compare = collator.compare(left.customerName, right.customerName);
          break;
        case 'status':
          compare = collator.compare(left.status, right.status);
          break;
        case 'critical':
          compare =
            getOpenDefectsBySeverity(left, 'critical') -
            getOpenDefectsBySeverity(right, 'critical');
          break;
        case 'nextInspectionDate':
          compare =
            (left.nextInspectionDate ? new Date(left.nextInspectionDate).getTime() : 0) -
            (right.nextInspectionDate ? new Date(right.nextInspectionDate).getTime() : 0);
          break;
        case 'updatedAt':
          compare = new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
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

  const toggleSort = (nextField: SortField) => {
    if (sortField === nextField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      setPage(1);
      return;
    }
    setSortField(nextField);
    setSortDirection('asc');
    setPage(1);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2 xl:hidden">
        {pagedRecords.map((record) => {
          const criticalCount = getOpenDefectsBySeverity(record, 'critical');
          const isHighlighted = highlightedId === record.id;
          return (
            <div
              key={record.id}
              className={
                isHighlighted
                  ? 'rounded-lg border border-border/70 bg-muted/40 p-3 ring-1 ring-border/60'
                  : 'rounded-lg border border-border/70 bg-background/80 p-3'
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/abnahmen/${record.id}`}
                    className="font-mono text-xs font-semibold text-primary/95 hover:text-primary hover:underline"
                  >
                    {record.number}
                  </Link>
                  {isHighlighted ? <p className="mt-0.5 text-[10px] font-medium text-primary">Vorschlag</p> : null}
                </div>
                <AbnahmenStatusBadge status={record.status} />
              </div>
              <p className="mt-2 text-sm font-semibold">{record.projectName}</p>
              <p className="text-sm text-muted-foreground">{record.customerName}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Nächste Prüfung: {record.nextInspectionDate ? formatDate(record.nextInspectionDate) : '—'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Badge variant={criticalCount > 0 ? 'destructive' : 'secondary'}>{criticalCount} kritisch</Badge>
                <span className="text-xs text-muted-foreground">Aktualisiert: {formatDate(record.updatedAt)}</span>
              </div>
              <div className="mt-3">
                <Button asChild size="sm" className="w-full">
                  <Link href={`/abnahmen/${record.id}`}>
                    <FilePenLine className="h-3.5 w-3.5" />
                    Öffnen
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden max-h-128 overflow-auto rounded-lg border border-border/60 bg-background/80 xl:block">
        <Table className="min-w-260 table-auto">
          <TableHeader className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur supports-backdrop-filter:bg-slate-100/95 dark:bg-slate-900/95">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-32.5 px-3 py-2.5">
                <SortButton field="number" label="Nummer" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="min-w-55 px-3 py-2.5">
                <SortButton field="projectName" label="Projekt" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="min-w-50 px-3 py-2.5">
                <SortButton field="customerName" label="Kunde" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-42.5 px-3 py-2.5">
                <SortButton field="status" label="Status" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-22.5 px-3 py-2.5">
                <SortButton field="critical" label="Kritisch" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-35 px-3 py-2.5">
                <SortButton field="nextInspectionDate" label="Nächste Prüfung" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-32.5 px-3 py-2.5">
                <SortButton field="updatedAt" label="Aktualisiert" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-27.5 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRecords.map((record) => {
              const criticalCount = getOpenDefectsBySeverity(record, 'critical');
              const isHighlighted = highlightedId === record.id;
              return (
                <TableRow
                  key={record.id}
                  className={
                    isHighlighted
                      ? 'cursor-pointer align-middle bg-muted/40 ring-1 ring-border/60'
                      : 'cursor-pointer align-middle odd:bg-slate-50/40 hover:bg-slate-100/60 dark:odd:bg-slate-900/30 dark:hover:bg-slate-800/45'
                  }
                >
                  <TableCell className="px-3 py-2 font-mono text-[11px] font-semibold">
                    <Link
                      href={`/abnahmen/${record.id}`}
                      className="text-primary/95 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {record.number}
                    </Link>
                    {isHighlighted ? <span className="ml-2 text-[10px] font-medium text-primary">Vorschlag</span> : null}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                    <div className="max-w-70 truncate" title={record.projectName}>
                      {record.projectName}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                    <div className="max-w-65 truncate" title={record.customerName}>
                      {record.customerName}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <AbnahmenStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Badge variant={criticalCount > 0 ? 'destructive' : 'secondary'}>{criticalCount}</Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                    {record.nextInspectionDate ? formatDate(record.nextInspectionDate) : '—'}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">{formatDate(record.updatedAt)}</TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <Button
                      asChild
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-md border-border/70 bg-background/90"
                    >
                      <Link href={`/abnahmen/${record.id}`} aria-label="Abnahme oeffnen">
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
      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {(isSearchActive ? records.length : totalEntries)} {isSearchActive ? 'Treffer' : 'Einträge'} · Seite {safePage} von {totalPages}
        </span>
        <div className="flex items-center gap-2 self-end sm:self-auto">
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
