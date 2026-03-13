'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FilePenLine } from 'lucide-react';

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

export function AufmassListTable({
  records,
  highlightedId,
}: {
  records: AufmassRecord[];
  highlightedId?: string;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = useMemo(
    () => records.slice((safePage - 1) * pageSize, safePage * pageSize),
    [records, safePage],
  );
  useEffect(() => {
    setPage(1);
  }, [records]);

  return (
    <div className="space-y-2">
      <div className="max-h-128 overflow-auto rounded-md border border-border/60">
        <Table className="min-w-245 table-auto">
          <TableHeader className="sticky top-0 z-10 bg-muted/85 backdrop-blur supports-backdrop-filter:bg-muted/75">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-32.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Nummer</TableHead>
              <TableHead className="min-w-55 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Projekt</TableHead>
              <TableHead className="min-w-50 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Kunde</TableHead>
              <TableHead className="w-42.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Status</TableHead>
              <TableHead className="w-22.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Version</TableHead>
              <TableHead className="w-32.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Aktualisiert</TableHead>
              <TableHead className="w-27.5 px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRecords.map((record) => {
              const isHighlighted = highlightedId === record.id;
              return (
                <TableRow
                  key={record.id}
                  className={isHighlighted ? 'align-middle bg-primary/5 ring-1 ring-primary/25' : 'align-middle odd:bg-muted/20'}
                >
                  <TableCell className="px-4 py-2 font-mono text-[11px] font-semibold">
                    <Link
                      href={`/aufmass/${record.id}`}
                      className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {record.number}
                    </Link>
                    {isHighlighted ? <span className="ml-2 text-[10px] font-medium text-primary">Vorschlag</span> : null}
                  </TableCell>
                  <TableCell className="px-4 py-2 font-medium">
                    <div className="max-w-70 truncate" title={record.projectName}>
                      {record.projectName}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">
                    <div className="max-w-65 truncate" title={record.customerName}>
                      {record.customerName}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <AufmassStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">v{record.version}</TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">{formatDate(record.updatedAt)}</TableCell>
                  <TableCell className="px-4 py-2 text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/aufmass/${record.id}`}>
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
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Seite {safePage} von {totalPages} · {records.length} Einträge
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={safePage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Zurück
          </Button>
          <Button
            size="sm"
            variant="outline"
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
