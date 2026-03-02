const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

type ApiErrorPayload = {
  error?: unknown;
  message?: unknown;
};

function toUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function headerWithToken(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();
  if (!raw) {
    return `Request failed (${response.status})`;
  }

  try {
    const payload = JSON.parse(raw) as ApiErrorPayload;
    if (typeof payload.error === 'string' && payload.error.length > 0) {
      return payload.error;
    }
    if (typeof payload.message === 'string' && payload.message.length > 0) {
      return payload.message;
    }
  } catch {
    // Keep raw response body as fallback message.
  }

  return raw;
}

async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown, token?: string | null): Promise<T> {
  const response = await fetch(toUrl(path), {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headerWithToken(token)
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as T;
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  return request<T>('GET', path, undefined, token);
}

export async function apiPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  return request<T>('POST', path, body, token);
}
