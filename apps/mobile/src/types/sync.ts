export type ClientOperation = {
  clientOpId: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payloadDelta: Record<string, unknown>;
  baseVersion: number;
  occurredAt: string;
};

export type VectorClock = Record<string, number>;
