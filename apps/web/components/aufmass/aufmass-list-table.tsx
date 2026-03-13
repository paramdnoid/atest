'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, FilePenLine } from 'lucide-react';

import { AufmassStatusBadge } from '@/components/aufmass/aufmass-status-badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AufmassRecord } from '@/lib/aufmass/types';
import { formatDate } from '@/lib/format';

type SortField = 'number' | 'projectName' | 'customerName' | 'status' | 'version' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export function AufmassListTable({
  records,
  highlightedId,
  selectedId,
  onSelect,
}: {
  records: AufmassRecord[];
  highlightedId?: string;
  selectedId?: string;
  onSelect?: (recordId: string) => void;
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
        case 'version':
          compare = left.version - right.version;
          break;
        case 'updatedAt':
          compare = new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime();
          break;
        case 'status':
          compare = collator.compare(left.status, right.status);
          break;
        case 'number':
          compare = collator.compare(left.number, right.number);
          break;
        case 'projectName':
          compare = collator.compare(left.projectName, right.projectName);
          break;
        case 'customerName':
          compare = collator.compare(left.customerName, right.customerName);
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

  useEffect(() => {
    setPage(1);
  }, [records, sortDirection, sortField]);

  return (
    <div className="space-y-2">
      <div className="max-h-128 overflow-auto rounded-xl border border-border/60 bg-background/80">
        <Table className="min-w-245 table-auto">
          <TableHeader className="sticky top-0 z-10 bg-linear-to-r from-slate-100/95 via-slate-50/95 to-orange-50/65 backdrop-blur supports-backdrop-filter:bg-linear-to-r dark:from-slate-900/95 dark:via-slate-900/95 dark:to-slate-800/90">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-32.5 px-3 py-2.5">
                <SortButton field="number" label="Nummer" />
              </TableHead>
              <TableHead className="min-w-55 px-3 py-2.5">
                <SortButton field="projectName" label="Projekt" />
              </TableHead>
              <TableHead className="min-w-50 px-3 py-2.5">
                <SortButton field="customerName" label="Kunde" />
              </TableHead>
              <TableHead className="w-42.5 px-3 py-2.5">
                <SortButton field="status" label="Status" />
              </TableHead>
              <TableHead className="w-22.5 px-3 py-2.5">
                <SortButton field="version" label="Version" />
              </TableHead>
              <TableHead className="w-32.5 px-3 py-2.5">
                <SortButton field="updatedAt" label="Aktualisiert" />
              </TableHead>
              <TableHead className="w-27.5 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRecords.map((record) => {
              const isHighlighted = highlightedId === record.id;
              const isSelected = selectedId === record.id;
              return (
                <TableRow
                  key={record.id}
                  className={
                    isSelected
                      ? 'cursor-pointer align-middle bg-primary/8 ring-1 ring-primary/25'
                      : isHighlighted
                        ? 'cursor-pointer align-middle bg-primary/5 ring-1 ring-primary/15'
                        : 'cursor-pointer align-middle odd:bg-slate-50/40 hover:bg-slate-100/60 dark:odd:bg-slate-900/30 dark:hover:bg-slate-800/45'
                  }
                  onClick={() => onSelect?.(record.id)}
                >
                  <TableCell className="px-3 py-2 font-mono text-[11px] font-semibold">
                    <Link
                      href={`/aufmass/${record.id}`}
                      className="text-primary/95 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {record.number}
                    </Link>
                    {isHighlighted ? <span className="ml-1.5 text-[10px] font-medium text-primary">Vorschlag</span> : null}
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
                    <AufmassStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">v{record.version}</TableCell>
                  <TableCell className="px-3 py-2 text-sm text-muted-foreground">{formatDate(record.updatedAt)}</TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <Button asChild size="sm" variant="outline" className="h-7 rounded-md border-border/70 bg-background/90 px-2 text-xs">
                      <Link href={`/aufmass/${record.id}`}>
                        <FilePenLine className="h-3.5 w-3.5" />
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
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Seite {safePage} von {totalPages} · {records.length} Einträge
        </span>
        <div className="flex items-center gap-2">
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
