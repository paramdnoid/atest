import Link from 'next/link';

import { AufmassStatusBadge } from '@/components/aufmass/aufmass-status-badge';
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

export function AufmassListTable({ records }: { records: AufmassRecord[] }) {
  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="px-4 py-3">Nummer</TableHead>
          <TableHead className="px-4 py-3">Projekt</TableHead>
          <TableHead className="px-4 py-3">Kunde</TableHead>
          <TableHead className="px-4 py-3">Status</TableHead>
          <TableHead className="px-4 py-3">Version</TableHead>
          <TableHead className="px-4 py-3">Aktualisiert</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="px-4 py-3 font-mono text-xs">
              <Link href={`/aufmass/${record.id}`} className="text-primary hover:underline">
                {record.number}
              </Link>
            </TableCell>
            <TableCell className="px-4 py-3 font-medium">{record.projectName}</TableCell>
            <TableCell className="px-4 py-3 text-muted-foreground">{record.customerName}</TableCell>
            <TableCell className="px-4 py-3">
              <AufmassStatusBadge status={record.status} />
            </TableCell>
            <TableCell className="px-4 py-3 text-muted-foreground">v{record.version}</TableCell>
            <TableCell className="px-4 py-3 text-muted-foreground">{formatDate(record.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
