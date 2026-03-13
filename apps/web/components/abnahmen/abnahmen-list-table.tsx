import Link from 'next/link';
import { FilePenLine } from 'lucide-react';

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

export function AbnahmenListTable({
  records,
  highlightedId,
}: {
  records: AbnahmeRecord[];
  highlightedId?: string;
}) {
  return (
    <div className="max-h-128 overflow-auto rounded-md border border-border/60">
      <Table className="min-w-260 table-auto">
        <TableHeader className="sticky top-0 z-10 bg-muted/85 backdrop-blur supports-backdrop-filter:bg-muted/75">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-32.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Nummer</TableHead>
            <TableHead className="min-w-55 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Projekt</TableHead>
            <TableHead className="min-w-50 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Kunde</TableHead>
            <TableHead className="w-42.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Status</TableHead>
            <TableHead className="w-22.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Kritisch</TableHead>
            <TableHead className="w-35 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Nächste Prüfung</TableHead>
            <TableHead className="w-32.5 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground">Aktualisiert</TableHead>
            <TableHead className="w-27.5 px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground">Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const criticalCount = getOpenDefectsBySeverity(record, 'critical');
            const isHighlighted = highlightedId === record.id;
            return (
              <TableRow
                key={record.id}
                className={isHighlighted ? 'align-middle bg-primary/5 ring-1 ring-primary/25' : 'align-middle odd:bg-muted/20'}
              >
                <TableCell className="px-4 py-2 font-mono text-[11px] font-semibold">
                  <Link
                    href={`/abnahmen/${record.id}`}
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
                  <AbnahmenStatusBadge status={record.status} />
                </TableCell>
                <TableCell className="px-4 py-2">
                  <Badge variant={criticalCount > 0 ? 'destructive' : 'secondary'}>{criticalCount}</Badge>
                </TableCell>
                <TableCell className="px-4 py-2 text-muted-foreground">
                  {record.nextInspectionDate ? formatDate(record.nextInspectionDate) : '—'}
                </TableCell>
                <TableCell className="px-4 py-2 text-muted-foreground">{formatDate(record.updatedAt)}</TableCell>
                <TableCell className="px-4 py-2 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/abnahmen/${record.id}`}>
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
