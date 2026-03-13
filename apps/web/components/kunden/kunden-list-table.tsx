import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, FilePenLine } from 'lucide-react';

import { KundenStatusBadge } from '@/components/kunden/kunden-status-badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import type { KundenRecord } from '@/lib/kunden/types';

type SortField = 'number' | 'name' | 'region' | 'owner' | 'objekte' | 'score' | 'status' | 'followUp';
type SortDirection = 'asc' | 'desc';

type KundenListTableProps = {
  records: KundenRecord[];
  totalEntries: number;
  isSearchActive: boolean;
  highlightedId?: string;
};

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

export function KundenListTable({ records, totalEntries, isSearchActive, highlightedId }: KundenListTableProps) {
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const pageSize = 25;

  const sortedRecords = useMemo(() => {
    const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
    return [...records].sort((left, right) => {
      let compare = 0;
      switch (sortField) {
        case 'number':
          compare = collator.compare(left.number, right.number);
          break;
        case 'name':
          compare = collator.compare(left.name, right.name);
          break;
        case 'region':
          compare = collator.compare(left.region, right.region);
          break;
        case 'owner':
          compare = collator.compare(left.owner, right.owner);
          break;
        case 'objekte':
          compare = left.objekte.length - right.objekte.length;
          break;
        case 'score':
          compare = left.score - right.score;
          break;
        case 'status':
          compare = collator.compare(left.status, right.status);
          break;
        case 'followUp':
          compare =
            (left.nextFollowUpAt ? new Date(left.nextFollowUpAt).getTime() : 0) -
            (right.nextFollowUpAt ? new Date(right.nextFollowUpAt).getTime() : 0);
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
                    href={`/kunden/${record.id}`}
                    className="font-mono text-xs font-semibold text-primary/95 hover:text-primary hover:underline"
                  >
                    {record.number}
                  </Link>
                  {isHighlighted ? <p className="mt-0.5 text-[10px] font-medium text-primary">Vorschlag</p> : null}
                </div>
                <KundenStatusBadge status={record.status} />
              </div>
              <p className="mt-2 text-sm font-semibold">{record.name}</p>
              <p className="text-sm text-muted-foreground">
                {record.region} · {record.owner}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Objekte: {record.objekte.length}</span>
                <span>Score: {record.score}</span>
                <span>Follow-up: {record.nextFollowUpAt ? formatDate(record.nextFollowUpAt) : '—'}</span>
              </div>
              <div className="mt-3">
                <Button asChild size="sm" className="w-full">
                  <Link href={`/kunden/${record.id}`}>
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
        <Table className="min-w-270 table-auto">
          <TableHeader className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur supports-backdrop-filter:bg-slate-100/95 dark:bg-slate-900/95">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-32.5 px-3 py-2.5">
                <SortButton field="number" label="Nummer" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="min-w-80 max-w-none px-3 py-2.5">
                <SortButton field="name" label="Kunde" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-32.5 px-3 py-2.5">
                <SortButton field="region" label="Region" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-37.5 px-3 py-2.5">
                <SortButton field="owner" label="Verantwortlich" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-22.5 px-3 py-2.5">
                <SortButton field="objekte" label="Objekte" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-22.5 px-3 py-2.5">
                <SortButton field="score" label="Score" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-42.5 px-3 py-2.5">
                <SortButton field="status" label="Status" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-32.5 px-3 py-2.5">
                <SortButton field="followUp" label="Follow-up" sortField={sortField} sortDirection={sortDirection} onSort={toggleSort} />
              </TableHead>
              <TableHead className="w-27.5 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRecords.map((record) => {
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
                      href={`/kunden/${record.id}`}
                      className="text-primary/95 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {record.number}
                    </Link>
                    {isHighlighted ? <span className="ml-2 text-[10px] font-medium text-primary">Vorschlag</span> : null}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                    <div className="max-w-[20rem] lg:max-w-md xl:max-w-none truncate" title={record.name}>
                      {record.name}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">{record.region}</TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">{record.owner}</TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">{record.objekte.length}</TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">{record.score}</TableCell>
                  <TableCell className="px-3 py-2">
                    <KundenStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                    {record.nextFollowUpAt ? formatDate(record.nextFollowUpAt) : '—'}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <Button
                      asChild
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 rounded-md border-border/70 bg-background/90"
                    >
                      <Link href={`/kunden/${record.id}`} aria-label="Kunde oeffnen">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="hidden md:block">
          {(isSearchActive ? records.length : totalEntries)} {isSearchActive ? 'Treffer' : 'Einträge'} · Seite {safePage} von {totalPages}
        </span>
        <span className="block md:hidden">
          Seite {safePage}/{totalPages}
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            size="sm"
            variant="default"
            disabled={safePage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Zurück</span>
            <span className="sm:hidden">‹</span>
          </Button>
          <Button
            size="sm"
            variant="default"
            disabled={safePage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Weiter</span>
            <span className="sm:hidden">›</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
