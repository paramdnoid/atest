import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Seat = {
  id: string;
  userEmail: string;
  status: 'ACTIVE' | 'REVOKED' | 'PENDING';
  updatedAt: string;
};

const statusVariants: Record<Seat['status'], 'default' | 'secondary' | 'outline'> = {
  ACTIVE: 'default',
  REVOKED: 'secondary',
  PENDING: 'outline',
};

export function LicenseSeatTable({ seats }: { seats: Seat[] }) {
  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          <TableHead className="px-4 py-3">Seat ID</TableHead>
          <TableHead className="px-4 py-3">User</TableHead>
          <TableHead className="px-4 py-3">Status</TableHead>
          <TableHead className="px-4 py-3">Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {seats.map((seat) => (
          <TableRow key={seat.id}>
            <TableCell className="px-4 py-3 font-mono text-xs">{seat.id}</TableCell>
            <TableCell className="px-4 py-3">{seat.userEmail}</TableCell>
            <TableCell className="px-4 py-3">
              <Badge variant={statusVariants[seat.status]}>{seat.status}</Badge>
            </TableCell>
            <TableCell className="px-4 py-3 text-muted-foreground">{seat.updatedAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
