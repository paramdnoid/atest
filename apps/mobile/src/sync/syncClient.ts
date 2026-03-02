import type { ClientOperation, VectorClock } from '../types/sync';

export type PushChangesRequest = {
  tenantId: string;
  deviceId: string;
  operations: ClientOperation[];
  vectorClock: VectorClock;
};

export type PullChangesRequest = {
  tenantId: string;
  deviceId: string;
  sinceCursor: string;
};

export type SyncTransport = {
  pushChanges: (request: PushChangesRequest) => Promise<{ acceptedOperationIds: string[] }>;
  pullChanges: (request: PullChangesRequest) => Promise<{ nextCursor: string; changes: unknown[] }>;
};

export async function runSyncCycle(
  transport: SyncTransport,
  params: {
    tenantId: string;
    deviceId: string;
    sinceCursor: string;
    pendingOperations: ClientOperation[];
    vectorClock: VectorClock;
  }
) {
  await transport.pushChanges({
    tenantId: params.tenantId,
    deviceId: params.deviceId,
    operations: params.pendingOperations,
    vectorClock: params.vectorClock
  });

  const pulled = await transport.pullChanges({
    tenantId: params.tenantId,
    deviceId: params.deviceId,
    sinceCursor: params.sinceCursor
  });

  return pulled;
}
