import { useState } from 'react';

import { FormTextarea } from '@/components/angebote/form-controls';
import { Button } from '@/components/ui/button';

type AngeboteApprovalDialogProps = {
  onApprove: (comment: string) => void;
  onReturnToDraft: (comment: string) => void;
};

export function AngeboteApprovalDialog({ onApprove, onReturnToDraft }: AngeboteApprovalDialogProps) {
  const [comment, setComment] = useState('');

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">Freigabeentscheidung</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Kommentar ist fuer Audit-Trail und Rueckfragen im Team sichtbar.
      </p>
      <FormTextarea
        className="mt-3"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Kommentar fuer Freigabe oder Rueckgabe..."
      />
      <p className="mt-1 text-xs text-muted-foreground">{comment.length} Zeichen</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onApprove(comment)}>
          Freigeben
        </Button>
        <Button size="sm" variant="outline" onClick={() => onReturnToDraft(comment)}>
          Zurueck an Entwurf
        </Button>
      </div>
    </div>
  );
}
