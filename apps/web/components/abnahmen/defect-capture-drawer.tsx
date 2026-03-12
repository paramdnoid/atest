'use client';

import { useState } from 'react';
import { Camera, PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { DefectCategory, DefectEntry, DefectSeverity } from '@/lib/abnahmen/types';

type DefectCaptureDrawerProps = {
  onAddDefect: (defect: DefectEntry) => void;
};

export function DefectCaptureDrawer({ onAddDefect }: DefectCaptureDrawerProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [severity, setSeverity] = useState<DefectSeverity>('major');
  const [category, setCategory] = useState<DefectCategory>('surface');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <PlusCircle className="h-4 w-4" />
          Mangel erfassen
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-auto">
        <SheetHeader>
          <SheetTitle>Mangel erfassen</SheetTitle>
          <SheetDescription>
            Vor-Ort-Erfassung mit wenigen Schritten inklusive Kategorie und Fälligkeit.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-3 p-4 pt-0 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="defect-title" className="text-sm font-medium">
              Titel
            </label>
            <Input
              id="defect-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="z. B. Fehlstelle am Sockel"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="defect-description" className="text-sm font-medium">
              Beschreibung
            </label>
            <Input
              id="defect-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Kurze, präzise Mangelbeschreibung"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="defect-location" className="text-sm font-medium">
              Ort
            </label>
            <Input
              id="defect-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Bauteil/Etage/Raum"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="defect-due-date" className="text-sm font-medium">
              Frist
            </label>
            <Input
              id="defect-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="defect-severity" className="text-sm font-medium">
              Schweregrad
            </label>
            <select
              id="defect-severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value as DefectSeverity)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="minor">minor</option>
              <option value="major">major</option>
              <option value="critical">critical</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="defect-category" className="text-sm font-medium">
              Kategorie
            </label>
            <select
              id="defect-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as DefectCategory)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="surface">surface</option>
              <option value="protection">protection</option>
              <option value="cleanliness">cleanliness</option>
              <option value="dimension">dimension</option>
              <option value="documentation">documentation</option>
              <option value="safety">safety</option>
            </select>
          </div>
        </div>
        <SheetFooter>
          <Button size="sm" variant="outline" className="w-full">
            <Camera className="h-4 w-4" />
            Foto hinzufügen
          </Button>
          <Button
            className="w-full"
            disabled={!title || !description || !location}
            onClick={() => {
              const now = new Date().toISOString();
              onAddDefect({
                id: crypto.randomUUID(),
                ref: `M-${Math.floor(Math.random() * 1000)
                  .toString()
                  .padStart(3, '0')}`,
                title,
                description,
                category,
                severity,
                status: 'OPEN',
                location,
                dueDate: dueDate || undefined,
                createdAt: now,
                updatedAt: now,
                evidence: [],
                reopenCount: 0,
              });
              setTitle('');
              setDescription('');
              setLocation('');
              setDueDate('');
              setSeverity('major');
              setCategory('surface');
              setOpen(false);
            }}
          >
            Mangel speichern
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
