export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

type ApiErrorPayload = {
  error?: string;
};

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    public readonly payload: unknown,
  ) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      typeof (payload as ApiErrorPayload).error === 'string'
        ? (payload as ApiErrorPayload).error!
        : `API request failed (${status}): ${path}`;
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new ApiRequestError(response.status, path, payload);
  }

  return payload as T;
}
