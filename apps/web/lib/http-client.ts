export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const DEFAULT_REQUEST_TIMEOUT_MS = 12_000;
const DEFAULT_RETRY_ATTEMPTS = 1;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 502, 503, 504]);

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

export class ApiTimeoutError extends Error {
  constructor(
    public readonly path: string,
    public readonly timeoutMs: number,
  ) {
    super(`API request timed out (${timeoutMs}ms): ${path}`);
    this.name = 'ApiTimeoutError';
  }
}

export async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
  retryAttempts?: number;
};

function mergeAbortSignals(
  signal?: AbortSignal | null,
  timeoutSignal?: AbortSignal | null,
): AbortSignal | undefined {
  if (!signal) return timeoutSignal ?? undefined;
  if (!timeoutSignal) return signal ?? undefined;
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([signal, timeoutSignal]);
  }
  return signal;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isIdempotentMethod(method?: string): boolean {
  const normalized = (method ?? 'GET').toUpperCase();
  return normalized === 'GET' || normalized === 'HEAD' || normalized === 'OPTIONS';
}

function shouldRetryResponse(method: string | undefined, response: Response): boolean {
  if (!isIdempotentMethod(method)) return false;
  return RETRYABLE_STATUS_CODES.has(response.status);
}

function shouldRetryError(method: string | undefined, error: unknown): boolean {
  if (!isIdempotentMethod(method)) return false;
  if (error instanceof ApiTimeoutError) return true;
  if (error instanceof TypeError) return true;
  return false;
}

export async function apiFetch(path: string, init?: ApiFetchOptions): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const retryAttempts = Math.max(0, init?.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS);
  const method = init?.method;
  const externalSignal = init?.signal;

  for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
    const signal = mergeAbortSignals(externalSignal, timeoutController.signal);
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: 'include',
        cache: 'no-store',
        ...init,
        signal,
      });

      if (attempt < retryAttempts && shouldRetryResponse(method, response)) {
        await sleep(200 * (attempt + 1));
        continue;
      }

      return response;
    } catch (error) {
      if (timeoutController.signal.aborted) {
        const timeoutError = new ApiTimeoutError(path, timeoutMs);
        if (attempt < retryAttempts && shouldRetryError(method, timeoutError)) {
          await sleep(200 * (attempt + 1));
          continue;
        }
        throw timeoutError;
      }

      if (attempt < retryAttempts && shouldRetryError(method, error)) {
        await sleep(200 * (attempt + 1));
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(`Unexpected fetch retry flow for: ${path}`);
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new ApiRequestError(response.status, path, payload);
  }

  return payload as T;
}
