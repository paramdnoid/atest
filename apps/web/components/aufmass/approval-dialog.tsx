'use client';

import { useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AufmassStatus } from '@/lib/aufmass/types';

type ApprovalDialogProps = {
  currentStatus: AufmassStatus;
  onApprove: (comment: string) => void;
  onReturnToDraft: (comment: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ApprovalDialog({
  currentStatus,
  onApprove,
  onReturnToDraft,
  open: controlledOpen,
  onOpenChange,
}: ApprovalDialogProps) {
  const [comment, setComment] = useState('');
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;

  const canApprove = currentStatus === 'IN_REVIEW';
  const canReturn = currentStatus === 'IN_REVIEW';

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          Prüfdialog
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Prüfung und Freigabe</SheetTitle>
          <SheetDescription>
            Dokumentiere deine Entscheidung mit einem nachvollziehbaren Kommentar.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4 pt-0">
          <label className="text-sm font-medium" htmlFor="approval-comment">
            Kommentar
          </label>
          <Input
            id="approval-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Prüfnotiz oder Rückgabegrund..."
          />
        </div>
        <SheetFooter>
          <div className="flex w-full flex-col gap-2">
            <Button
              className="w-full"
              disabled={!canApprove || comment.trim().length === 0}
              onClick={() => {
                onApprove(comment.trim());
                setOpen(false);
                setComment('');
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Freigabe erteilen
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              disabled={!canReturn || comment.trim().length === 0}
              onClick={() => {
                onReturnToDraft(comment.trim());
                setOpen(false);
                setComment('');
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Mit Kommentar zurückgeben
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
