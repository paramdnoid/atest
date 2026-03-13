import { useMemo, useState } from 'react';
import { PencilLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getPositionRevenueNet } from '@/lib/angebote/pricing';
import type { QuotePosition } from '@/lib/angebote/types';

type AngebotePositionTableProps = {
  positions: QuotePosition[];
  onUpdatePositions: (positions: QuotePosition[]) => void;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

export function AngebotePositionTable({ positions, onUpdatePositions }: AngebotePositionTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState('');
  const [draftQuantity, setDraftQuantity] = useState('');

  const editingPosition = useMemo(
    () => positions.find((position) => position.id === editingId),
    [editingId, positions],
  );

  const openEditor = (position: QuotePosition) => {
    setEditingId(position.id);
    setDraftPrice(String(position.unitPriceNet));
    setDraftQuantity(String(position.quantity));
  };

  const save = () => {
    if (!editingId) return;
    const next = positions.map((position) => {
      if (position.id !== editingId) return position;
      return {
        ...position,
        unitPriceNet: Number(draftPrice) || position.unitPriceNet,
        quantity: Number(draftQuantity) || position.quantity,
      };
    });
    onUpdatePositions(next);
    setEditingId(null);
  };

  const quantityFieldId = editingId ? `${editingId}-quantity` : 'quantity-input';
  const priceFieldId = editingId ? `${editingId}-price` : 'price-input';

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 py-3">Position</TableHead>
            <TableHead className="px-4 py-3">Menge</TableHead>
            <TableHead className="px-4 py-3">EP netto</TableHead>
            <TableHead className="px-4 py-3">Umsatz</TableHead>
            <TableHead className="px-4 py-3">Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => (
            <TableRow key={position.id}>
            <TableCell className="px-4 py-2">
                <div>
                  <p className="font-medium">{position.title}</p>
                  <p className="text-xs text-muted-foreground">{position.unit}</p>
                </div>
              </TableCell>
              <TableCell className="px-4 py-2">{position.quantity}</TableCell>
              <TableCell className="px-4 py-2">{formatCurrency(position.unitPriceNet)}</TableCell>
              <TableCell className="px-4 py-2">{formatCurrency(getPositionRevenueNet(position))}</TableCell>
              <TableCell className="px-4 py-2">
                <Button size="sm" variant="outline" onClick={() => openEditor(position)}>
                  <PencilLine className="h-4 w-4" />
                  Bearbeiten
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingPosition && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">Side-Panel Bearbeitung: {editingPosition.title}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={quantityFieldId} className="text-xs text-muted-foreground">
                Menge
              </label>
              <Input
                id={quantityFieldId}
                inputMode="decimal"
                value={draftQuantity}
                onChange={(event) => setDraftQuantity(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={priceFieldId} className="text-xs text-muted-foreground">
                EP netto
              </label>
              <Input
                id={priceFieldId}
                inputMode="decimal"
                value={draftPrice}
                onChange={(event) => setDraftPrice(event.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={save}>
              Speichern
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
              Abbrechen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
