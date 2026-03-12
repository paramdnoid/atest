import type { OfflineQueueItem } from '@/lib/kunden/types';

export type OfflineSyncState = 'online' | 'queued' | 'syncing' | 'error';

export type OfflineQueueModel = {
  items: OfflineQueueItem[];
  state: OfflineSyncState;
  lastSyncedAt?: string;
  lastError?: string;
};

export function createOfflineQueueModel(): OfflineQueueModel {
  return {
    items: [],
    state: 'online',
  };
}

export function enqueueOfflineOperation(
  model: OfflineQueueModel,
  item: Omit<OfflineQueueItem, 'id' | 'createdAt'>,
): OfflineQueueModel {
  const queueItem: OfflineQueueItem = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...item,
  };
  return {
    ...model,
    items: [...model.items, queueItem],
    state: 'queued',
    lastError: undefined,
  };
}

export function startSync(model: OfflineQueueModel): OfflineQueueModel {
  if (model.items.length === 0) return { ...model, state: 'online' };
  return { ...model, state: 'syncing', lastError: undefined };
}

export function completeSync(model: OfflineQueueModel): OfflineQueueModel {
  return {
    ...model,
    state: 'online',
    items: [],
    lastError: undefined,
    lastSyncedAt: new Date().toISOString(),
  };
}

export function failSync(model: OfflineQueueModel, message: string): OfflineQueueModel {
  return {
    ...model,
    state: 'error',
    lastError: message,
  };
}
