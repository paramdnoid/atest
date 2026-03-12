import Link from 'next/link';

import { AbnahmenStatusBadge } from '@/components/abnahmen/abnahmen-status-badge';
import { Badge } from '@/components/ui/badge';
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

export function AbnahmenListTable({ records }: { records: AbnahmeRecord[] }) {
  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="px-4 py-3">Nummer</TableHead>
          <TableHead className="px-4 py-3">Projekt</TableHead>
          <TableHead className="px-4 py-3">Kunde</TableHead>
          <TableHead className="px-4 py-3">Status</TableHead>
          <TableHead className="px-4 py-3">Kritisch</TableHead>
          <TableHead className="px-4 py-3">Nächste Prüfung</TableHead>
          <TableHead className="px-4 py-3">Aktualisiert</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => {
          const criticalCount = getOpenDefectsBySeverity(record, 'critical');
          return (
            <TableRow key={record.id}>
              <TableCell className="px-4 py-3 font-mono text-xs">
                <Link href={`/abnahmen/${record.id}`} className="text-primary hover:underline">
                  {record.number}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3 font-medium">{record.projectName}</TableCell>
              <TableCell className="px-4 py-3 text-muted-foreground">{record.customerName}</TableCell>
              <TableCell className="px-4 py-3">
                <AbnahmenStatusBadge status={record.status} />
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant={criticalCount > 0 ? 'destructive' : 'secondary'}>{criticalCount}</Badge>
              </TableCell>
              <TableCell className="px-4 py-3 text-muted-foreground">
                {record.nextInspectionDate ? formatDate(record.nextInspectionDate) : '—'}
              </TableCell>
              <TableCell className="px-4 py-3 text-muted-foreground">{formatDate(record.updatedAt)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
