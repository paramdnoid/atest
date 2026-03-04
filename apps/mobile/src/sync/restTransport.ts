import { apiGet, apiPost } from '../lib/api';
import type { ClientOperation, VectorClock } from '../types/sync';
import type { PullChangesRequest, PushChangesRequest, SyncTransport } from './syncClient';

type PushResponsePayload = {
  acceptedOperationIds: string[];
  conflicts: ConflictPayload[];
};

type ConflictPayload = {
  clientOpId: string;
  resolutionType: string;
  resolvedPayloadJson: string;
  serverVectorClock: Record<string, number>;
  serverVersion: number;
  reason: string;
};

type ChangeEventPayload = {
  id: number;
  entityType: string;
  entityId: string;
  operation: string;
  payloadDeltaJson: string;
  serverVersion: number;
  occurredAt: string;
  resultVectorClock: Record<string, number>;
  conflict: boolean;
};

type PullResponsePayload = {
  changes: ChangeEventPayload[];
  nextCursor: string;
};

function toOperationPayload(op: ClientOperation, vectorClock: VectorClock) {
  return {
    clientOpId: op.clientOpId,
    entityType: op.entityType,
    entityId: op.entityId,
    operation: op.operation,
    payloadDelta: op.payloadDelta,
    baseVersion: op.baseVersion,
    occurredAt: op.occurredAt,
    vectorClock
  };
}

/**
 * Creates a SyncTransport backed by REST endpoints on the backend.
 *
 * Endpoints:
 *   POST /v1/sync/push  — pushes local operations to the server
 *   GET  /v1/sync/pull   — pulls remote changes since a cursor
 *
 * Auth: Bearer JWT passed via the accessToken parameter.
 */
export function createRestTransport(accessToken: string): SyncTransport {
  return {
    async pushChanges(request: PushChangesRequest) {
      const body = {
        deviceId: request.deviceId,
        operations: request.operations.map((op) => toOperationPayload(op, request.vectorClock)),
        vectorClock: request.vectorClock
      };

      const data = await apiPost<PushResponsePayload>('/v1/sync/push', body, accessToken);

      return {
        acceptedOperationIds: data.acceptedOperationIds ?? []
      };
    },

    async pullChanges(request: PullChangesRequest) {
      const params = new URLSearchParams({
        sinceCursor: request.sinceCursor,
        deviceId: request.deviceId
      });

      const data = await apiGet<PullResponsePayload>(`/v1/sync/pull?${params.toString()}`, accessToken);

      return {
        nextCursor: data.nextCursor ?? '0',
        changes: data.changes ?? []
      };
    }
  };
}
