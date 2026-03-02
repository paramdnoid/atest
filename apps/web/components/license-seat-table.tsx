type Seat = {
  id: string;
  userEmail: string;
  status: 'ACTIVE' | 'REVOKED' | 'PENDING';
  updatedAt: string;
};

const statusStyles: Record<Seat['status'], string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  REVOKED: 'bg-zinc-100 text-zinc-600',
  PENDING: 'bg-amber-50 text-amber-700'
};

export function LicenseSeatTable({ seats }: { seats: Seat[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 font-medium">Seat ID</th>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {seats.map((seat) => (
            <tr key={seat.id} className="border-t border-border">
              <td className="px-4 py-3 font-mono text-xs">{seat.id}</td>
              <td className="px-4 py-3">{seat.userEmail}</td>
              <td className="px-4 py-3">
                <span className={`rounded px-2 py-1 text-xs ${statusStyles[seat.status]}`}>{seat.status}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{seat.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
