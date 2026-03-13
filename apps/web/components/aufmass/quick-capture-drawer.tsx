'use client';

import { useState } from 'react';
import { Camera, PlusCircle } from 'lucide-react';

import { FormulaBuilder } from '@/components/aufmass/formula-builder/formula-builder';
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
import type {
  AufmassMeasurement,
  FormulaTemplateId,
  AufmassPosition,
  AufmassRoom,
  OpeningOrNiche,
} from '@/lib/aufmass/types';
import { getFormulaQuality } from '@/lib/aufmass/intelligence';
import { getOvermeasureBreakdown } from '@/lib/aufmass/overmeasure-engine';
import { parseOpeningKind } from '@/lib/aufmass/guards';
import {
  buildFormulaAst,
  evaluateFormulaAst,
  getTemplatesForUnit,
  serializeFormulaAst,
  type BuilderInputValues,
} from '@/lib/aufmass/formula-builder';
import { aufmassRolloutFlags } from '@/lib/aufmass/rollout-flags';
import { cn } from '@/lib/utils';

type QuickCaptureDrawerProps = {
  room?: AufmassRoom;
  positions: AufmassPosition[];
  onAddMeasurement: (measurement: AufmassMeasurement) => void;
  triggerClassName?: string;
};

export function QuickCaptureDrawer({ room, positions, onAddMeasurement, triggerClassName }: QuickCaptureDrawerProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(positions[0]?.id ?? null);
  const [templateId, setTemplateId] = useState<FormulaTemplateId>('wall_area');
  const [variables, setVariables] = useState<BuilderInputValues>({
    length: 0,
    width: 0,
    height: 0,
    openings: 0,
    factor: 1,
    count: 1,
  });
  const [openingKind, setOpeningKind] = useState<OpeningOrNiche['kind']>('OPENING');
  const [openingWidth, setOpeningWidth] = useState('');
  const [openingHeight, setOpeningHeight] = useState('');
  const [openingCount, setOpeningCount] = useState('1');

  const selectedPosition = positions.find((position) => position.id === selectedPositionId) ?? positions[0];
  const templates = selectedPosition ? getTemplatesForUnit(selectedPosition.unit) : [];
  const effectiveTemplateId =
    templates.find((template) => template.id === templateId)?.id ?? templates[0]?.id ?? templateId;
  const formulaAst = buildFormulaAst(effectiveTemplateId, variables);
  const formulaText = formulaAst ? serializeFormulaAst(formulaAst) : '';
  const formulaEvaluation = formulaAst ? evaluateFormulaAst(formulaAst) : { ok: false, error: 'Template fehlt.' };
  const quantityNumber = formulaEvaluation.ok ? formulaEvaluation.value ?? 0 : 0;
  const formulaQuality =
    formulaAst
      ? getFormulaQuality(formulaText, quantityNumber, formulaAst)
      : null;
  const formulaIsValid = formulaQuality ? formulaQuality.evaluation.ok : false;
  const hasHardFormulaIssue =
    aufmassRolloutFlags.enforceBuilderScoreGate && formulaQuality ? formulaQuality.score < 50 : false;
  const hasOpeningInput = openingWidth.length > 0 || openingHeight.length > 0;
  const opening: OpeningOrNiche | null =
    room && selectedPosition && hasOpeningInput
      ? {
          id: 'preview-opening',
          kind: openingKind,
          roomId: room.id,
          positionId: selectedPosition.id,
          width: Number(openingWidth || 0),
          height: Number(openingHeight || 0),
          count: Number(openingCount || 1),
        }
      : null;
  const overmeasurePreview =
    opening && room && selectedPosition
      ? getOvermeasureBreakdown(
          {
            id: 'preview-measurement',
            roomId: room.id,
            positionId: selectedPosition.id,
            label: label || 'Vorschau',
            formula: formulaText,
            formulaAst: formulaAst ?? undefined,
            formulaSource: 'builder',
            quantity: quantityNumber,
            unit: selectedPosition.unit,
            openingsOrNiches: [opening],
            createdAt: new Date().toISOString(),
          },
          selectedPosition.code,
        )
      : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" disabled={!room} className={cn(triggerClassName)}>
          <PlusCircle className="h-4 w-4" />
          Schnell erfassen
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-auto">
        <SheetHeader>
          <SheetTitle>Schnellerfassung Baustelle</SheetTitle>
          <SheetDescription>
            Große Eingabefelder für mobile Erfassung. Aktiver Raum: {room?.name ?? 'nicht gewählt'}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4 pt-0">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="capture-label">
              Bezeichnung
            </label>
            <Input
              id="capture-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="z. B. Wände Nordseite"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="capture-position">
              Position
            </label>
            <select
              id="capture-position"
              value={selectedPosition?.id ?? ''}
              onChange={(event) => setSelectedPositionId(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {positions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.code} · {position.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {selectedPosition && (
              <FormulaBuilder
                unit={selectedPosition.unit}
                value={{ templateId: effectiveTemplateId, variables }}
                onChange={(nextValue) => {
                  setTemplateId(nextValue.templateId);
                  setVariables(nextValue.variables);
                }}
                formulaText={formulaText}
                quantity={quantityNumber}
                quality={formulaQuality}
                evaluation={formulaEvaluation}
              />
            )}
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold">Öffnung / Nische (VOB Overmeasure)</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <select
                id="capture-opening-kind"
                value={openingKind}
                onChange={(event) => {
                  const next = parseOpeningKind(event.target.value);
                  if (next) {
                    setOpeningKind(next);
                  }
                }}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                aria-label="Typ von Öffnung oder Nische"
              >
                <option value="OPENING">Öffnung</option>
                <option value="NICHE">Nische</option>
              </select>
              <Input
                id="capture-opening-count"
                type="number"
                value={openingCount}
                onChange={(event) => setOpeningCount(event.target.value)}
                placeholder="Anzahl"
                aria-label="Anzahl von Öffnungen oder Nischen"
              />
              <Input
                id="capture-opening-width"
                type="number"
                value={openingWidth}
                onChange={(event) => setOpeningWidth(event.target.value)}
                placeholder="Breite (m)"
                aria-label="Breite von Öffnung oder Nische in Metern"
              />
              <Input
                id="capture-opening-height"
                type="number"
                value={openingHeight}
                onChange={(event) => setOpeningHeight(event.target.value)}
                placeholder="Höhe (m)"
                aria-label="Höhe von Öffnung oder Nische in Metern"
              />
            </div>
            {overmeasurePreview && (
              <div className="mt-2 rounded-md bg-sidebar/40 p-2 text-xs text-muted-foreground">
                <p>
                  Brutto: {overmeasurePreview.gross.toFixed(2)} · Abzug:{' '}
                  {overmeasurePreview.deducted.toFixed(2)} · Netto:{' '}
                  {overmeasurePreview.net.toFixed(2)}
                </p>
                {overmeasurePreview.decisions[0] && (
                  <p className="mt-1">
                    Regel: {overmeasurePreview.decisions[0].appliedRuleId} (
                    {overmeasurePreview.decisions[0].reason})
                  </p>
                )}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled
            title="Foto-/Notiz-Upload ist im Frontend-Roadmap-Schritt noch nicht aktiviert."
          >
            <Camera className="h-4 w-4" />
            Foto/Notiz hinzufügen (folgt)
          </Button>
        </div>
        <SheetFooter>
          <Button
            className="w-full"
            disabled={
              !room ||
              !selectedPosition ||
              !label ||
              !formulaAst ||
              !formulaIsValid ||
              hasHardFormulaIssue
            }
            onClick={() => {
              if (!room || !selectedPosition) return;
              onAddMeasurement({
                id: crypto.randomUUID(),
                roomId: room.id,
                positionId: selectedPosition.id,
                label,
                formula: formulaText,
                formulaAst: formulaAst ?? undefined,
                formulaSource: 'builder',
                quantity: quantityNumber,
                unit: selectedPosition.unit,
                openingsOrNiches: opening ? [opening] : [],
                createdAt: new Date().toISOString(),
              });
              setLabel('');
              setSelectedPositionId(positions[0]?.id ?? null);
              setVariables({ length: 0, width: 0, height: 0, openings: 0, factor: 1, count: 1 });
              setOpeningWidth('');
              setOpeningHeight('');
              setOpeningCount('1');
              setOpen(false);
            }}
          >
            Erfassung speichern
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
