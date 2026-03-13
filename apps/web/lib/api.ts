import { apiJson, ApiRequestError } from '@/lib/http-client';
import { getAccessToken } from '@/lib/session-token';

export type ApiRequest = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
};

type ApiValidator<T> = (payload: unknown) => T;

export async function apiRequest<T>({
  path,
  method = 'GET',
  body,
  token,
  validate,
}: ApiRequest & { validate?: ApiValidator<T> }): Promise<T> {
  const makeRequest = (authToken?: string) =>
    apiJson<unknown>(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  try {
    const payload = await makeRequest(token);
    return validate ? validate(payload) : (payload as T);
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 401 || !token) {
      throw error;
    }
    const refreshedToken = await getAccessToken(true);
    if (!refreshedToken) {
      throw error;
    }
    const payload = await makeRequest(refreshedToken);
    return validate ? validate(payload) : (payload as T);
  }
}
