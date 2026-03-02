import * as SecureStore from 'expo-secure-store';

const KEY_ALIAS = 'zunftgewerk_device_key_ref';

export async function ensureDeviceKeyReference(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_ALIAS);
  if (existing) {
    return existing;
  }

  const keyRef = `keyref_${Date.now().toString(36)}`;
  await SecureStore.setItemAsync(KEY_ALIAS, keyRef, {
    keychainService: 'zunftgewerk.keys'
  });
  return keyRef;
}

export type SqlCipherRecord = {
  id: string;
  payload: string;
};

// SQLCipher native binding should implement this interface.
export interface EncryptedDbDriver {
  open: (keyReference: string) => Promise<void>;
  upsert: (record: SqlCipherRecord) => Promise<void>;
  getById: (id: string) => Promise<SqlCipherRecord | null>;
  listPendingOperations: () => Promise<SqlCipherRecord[]>;
}
