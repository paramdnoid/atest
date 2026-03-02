import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'zg_access_token';
const USER_ID_KEY = 'zg_user_id';
const LAST_SYNC_KEY = 'zg_last_sync';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_ID_KEY)
  ]);
}

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_ID_KEY);
}

export async function setUserId(id: string): Promise<void> {
  await SecureStore.setItemAsync(USER_ID_KEY, id);
}

export async function getLastSyncTimestamp(): Promise<string | null> {
  return SecureStore.getItemAsync(LAST_SYNC_KEY);
}

export async function setLastSyncTimestamp(isoTimestamp: string): Promise<void> {
  await SecureStore.setItemAsync(LAST_SYNC_KEY, isoTimestamp);
}
