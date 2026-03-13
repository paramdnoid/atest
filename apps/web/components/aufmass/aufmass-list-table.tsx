'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, FilePenLine } from 'lucide-react';

import { AufmassStatusBadge } from '@/components/aufmass/aufmass-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';

type SortField = 'number' | 'projectName' | 'customerName' | 'status' | 'updatedAt';
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

  // Mobile Card View Component
  const MobileCard = ({ record, isHighlighted, isSelected }: { 
    record: AufmassRecord; 
    isHighlighted: boolean; 
    isSelected: boolean; 
  }) => (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        isSelected 
          ? 'bg-primary/6 ring-1 ring-primary/20' 
          : isHighlighted
            ? 'bg-primary/4 ring-1 ring-primary/15'
            : 'bg-background/95 hover:bg-muted/45 dark:bg-background/35 dark:hover:bg-muted/35'
      )}
      onClick={() => onSelect?.(record.id)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Link
              href={`/aufmass/${record.id}`}
              className="font-mono text-sm font-semibold text-primary/95 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {record.number}
            </Link>
            {isHighlighted && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Vorschlag
              </span>
            )}
          </div>
          <AufmassStatusBadge status={record.status} />
        </div>
        
        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Projekt</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate" title={record.projectName}>
              {record.projectName}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Kunde</p>
            <p className="text-sm text-muted-foreground truncate" title={record.customerName}>
              {record.customerName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {formatDate(record.updatedAt)}
          </span>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 px-3 border-border/70 bg-background/90"
          >
            <Link href={`/aufmass/${record.id}`} aria-label="Aufmass öffnen">
              <FilePenLine className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs">Öffnen</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  useEffect(() => {
    setPage(1);
  }, [records, sortDirection, sortField]);

  return (
    <div className="space-y-2">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="max-h-128 overflow-auto rounded-xl border border-border/60 bg-background/80">
          <Table className="min-w-222 table-auto">
            <TableHeader className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur supports-backdrop-filter:bg-slate-100/95 dark:bg-slate-900/95">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-32.5 px-3 py-2.5">
                  <SortButton field="number" label="Nummer" />
                </TableHead>
                <TableHead className="min-w-55 lg:min-w-80 px-3 py-2.5">
                  <SortButton field="projectName" label="Projekt" />
                </TableHead>
                <TableHead className="min-w-50 px-3 py-2.5">
                  <SortButton field="customerName" label="Kunde" />
                </TableHead>
                <TableHead className="w-42.5 px-3 py-2.5 text-center">
                  <SortButton field="status" label="Status" />
                </TableHead>
                <TableHead className="w-32.5 px-3 py-2.5 text-center">
                  <SortButton field="updatedAt" label="Aktualisiert" />
                </TableHead>
                <TableHead className="w-27.5 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:border-dotted">
              {pagedRecords.map((record) => {
                const isHighlighted = highlightedId === record.id;
                const isSelected = selectedId === record.id;
                return (
                  <TableRow
                    key={record.id}
                    className={
                      isSelected
                        ? 'cursor-pointer align-middle bg-primary/6 ring-1 ring-primary/20'
                        : isHighlighted
                          ? 'cursor-pointer align-middle bg-primary/4 ring-1 ring-primary/15'
                          : 'cursor-pointer align-middle bg-background/95 hover:bg-muted/45 dark:bg-background/35 dark:hover:bg-muted/35'
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
                      <div className="max-w-[18rem] lg:max-w-[24rem] xl:max-w-none truncate" title={record.projectName}>
                        {record.projectName}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                      <div className="max-w-[16rem] lg:max-w-[20rem] xl:max-w-none truncate" title={record.customerName}>
                        {record.customerName}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      <AufmassStatusBadge status={record.status} />
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center text-sm text-muted-foreground">{formatDate(record.updatedAt)}</TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      <Button
                        asChild
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-md border-border/70 bg-background/90"
                      >
                        <Link href={`/aufmass/${record.id}`} aria-label="Aufmass oeffnen">
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
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {records.length} {records.length === 1 ? 'Eintrag' : 'Einträge'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sortierung:</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 text-xs"
              onClick={() => toggleSort(sortField)}
            >
              {sortField === 'updatedAt' ? 'Aktualisiert' : 
               sortField === 'number' ? 'Nummer' :
               sortField === 'projectName' ? 'Projekt' :
               sortField === 'customerName' ? 'Kunde' : 'Status'}
              <SortIcon field={sortField} />
            </Button>
          </div>
        </div>
        {pagedRecords.map((record) => {
          const isHighlighted = highlightedId === record.id;
          const isSelected = selectedId === record.id;
          return (
            <MobileCard
              key={record.id}
              record={record}
              isHighlighted={isHighlighted}
              isSelected={isSelected}
            />
          );
        })}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="hidden md:block">
          Seite {safePage} von {totalPages} · {records.length} Einträge
        </span>
        <span className="block md:hidden">
          Seite {safePage}/{totalPages}
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={safePage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Zurück</span>
            <span className="sm:hidden">‹</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
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
