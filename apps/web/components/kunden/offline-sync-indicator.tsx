import { CloudOff, CloudUpload, RefreshCw, Wifi } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { OfflineSyncState } from '@/lib/kunden/offline-queue';

type OfflineSyncIndicatorProps = {
  state: OfflineSyncState;
  queuedCount: number;
  lastSyncedAt?: string;
};

export function OfflineSyncIndicator({ state, queuedCount, lastSyncedAt }: OfflineSyncIndicatorProps) {
  if (state === 'online') {
    return (
      <Badge variant="outline" className="gap-1">
        <Wifi className="h-3.5 w-3.5" />
        Online{lastSyncedAt ? ` · Sync ${new Date(lastSyncedAt).toLocaleTimeString('de-DE')}` : ''}
      </Badge>
    );
  }

  if (state === 'queued') {
    return (
      <Badge variant="secondary" className="gap-1">
        <CloudUpload className="h-3.5 w-3.5" />
        {queuedCount} in Queue
      </Badge>
    );
  }

  if (state === 'syncing') {
    return (
      <Badge variant="outline" className="gap-1">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Syncing
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <CloudOff className="h-3.5 w-3.5" />
      Sync Fehler
    </Badge>
  );
}
