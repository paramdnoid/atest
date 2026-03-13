import type { AufmassMeasurement, AufmassRecord, AufmassStatus } from '@/lib/aufmass/types';

export type AufmassApiErrorCode =
  | 'AUFMASS_NOT_FOUND'
  | 'AUFMASS_INVALID_TRANSITION'
  | 'AUFMASS_TRANSITION_BLOCKED'
  | 'AUFMASS_VERSION_CONFLICT'
  | 'AUFMASS_VALIDATION_ERROR'
  | 'AUFMASS_UNAUTHORIZED';

export type AufmassApiError = {
  code: AufmassApiErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
};

export type AufmassListResponse = {
  items: AufmassRecord[];
  total: number;
};

export type AufmassStatusTransitionRequest = {
  targetStatus: AufmassStatus;
  comment: string;
  expectedVersion: number;
};

export type AufmassStatusTransitionResponse = {
  record: AufmassRecord;
  blockers: string[];
};

export type AufmassCreateMeasurementRequest = {
  measurement: AufmassMeasurement;
  expectedVersion: number;
};
