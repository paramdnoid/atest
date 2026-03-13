import { getAufmassRecordById, getAufmassRecords } from '@/lib/aufmass/mock-data';
import type { AufmassRecord } from '@/lib/aufmass/types';

export type AufmassDataAdapterMode = 'mock' | 'api';

function getMode(): AufmassDataAdapterMode {
  // API mode is intentionally not implemented yet. This adapter keeps UI code stable.
  return process.env.NEXT_PUBLIC_AUFMASS_DATA_MODE === 'api' ? 'api' : 'mock';
}

async function readFromMockList(): Promise<AufmassRecord[]> {
  return getAufmassRecords();
}

async function readFromMockDetail(id: string): Promise<AufmassRecord | null> {
  return getAufmassRecordById(id);
}

async function readFromFutureApiList(): Promise<AufmassRecord[]> {
  // Placeholder for later API implementation.
  return getAufmassRecords();
}

async function readFromFutureApiDetail(id: string): Promise<AufmassRecord | null> {
  // Placeholder for later API implementation.
  return getAufmassRecordById(id);
}

export async function listAufmassRecords(): Promise<AufmassRecord[]> {
  const mode = getMode();
  if (mode === 'api') {
    return readFromFutureApiList();
  }
  return readFromMockList();
}

export async function getAufmassRecord(id: string): Promise<AufmassRecord | null> {
  const mode = getMode();
  if (mode === 'api') {
    return readFromFutureApiDetail(id);
  }
  return readFromMockDetail(id);
}

export function listAufmassRecordsSync(): AufmassRecord[] {
  return getAufmassRecords();
}

export function getAufmassRecordSync(id: string): AufmassRecord | null {
  return getAufmassRecordById(id);
}
