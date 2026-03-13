import Link from 'next/link';
import { FilePenLine } from 'lucide-react';

import { KundenStatusBadge } from '@/components/kunden/kunden-status-badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import type { KundenRecord } from '@/lib/kunden/types';

type KundenListTableProps = {
  records: KundenRecord[];
  highlightedId?: string;
};

export function KundenListTable({ records, highlightedId }: KundenListTableProps) {
  return (
    <div className="max-h-128 overflow-auto rounded-md border border-border/60">
      <Table className="min-w-270 table-auto">
        <TableHeader className="sticky top-0 z-10 bg-muted/85 backdrop-blur supports-backdrop-filter:bg-muted/75">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-32.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Nummer</TableHead>
            <TableHead className="min-w-60 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Kunde</TableHead>
            <TableHead className="w-32.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Region</TableHead>
            <TableHead className="w-37.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Verantwortlich</TableHead>
            <TableHead className="w-22.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Objekte</TableHead>
            <TableHead className="w-22.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Score</TableHead>
            <TableHead className="w-42.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Status</TableHead>
            <TableHead className="w-32.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">
              Follow-up
            </TableHead>
            <TableHead className="w-27.5 px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground">Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const isHighlighted = highlightedId === record.id;
            return (
              <TableRow
                key={record.id}
                className={isHighlighted ? 'align-middle bg-primary/5 ring-1 ring-primary/25' : 'align-middle odd:bg-muted/20'}
              >
              <TableCell className="px-4 py-2 font-mono text-[11px] font-semibold">
                <Link
                  href={`/kunden/${record.id}`}
                  className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {record.number}
                </Link>
                {isHighlighted ? <span className="ml-2 text-[10px] font-medium text-primary">Vorschlag</span> : null}
              </TableCell>
              <TableCell className="px-4 py-2 font-medium">
                <div className="max-w-75 truncate" title={record.name}>
                  {record.name}
                </div>
              </TableCell>
              <TableCell className="px-4 py-2 text-muted-foreground">{record.region}</TableCell>
              <TableCell className="px-4 py-2 text-muted-foreground">{record.owner}</TableCell>
              <TableCell className="px-4 py-2">{record.objekte.length}</TableCell>
              <TableCell className="px-4 py-2">{record.score}</TableCell>
              <TableCell className="px-4 py-2">
                <KundenStatusBadge status={record.status} />
              </TableCell>
              <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                {record.nextFollowUpAt ? formatDate(record.nextFollowUpAt) : '—'}
              </TableCell>
              <TableCell className="px-4 py-2 text-right">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/kunden/${record.id}`}>
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
