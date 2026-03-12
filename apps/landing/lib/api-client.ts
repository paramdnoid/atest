const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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
      typeof payload === "object" &&
      payload !== null &&
      typeof (payload as ApiErrorPayload).error === "string"
        ? (payload as ApiErrorPayload).error!
        : `API request failed (${status}): ${path}`;
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  // Client-side: credentials: "include" sends the cookie automatically
  return fetch(`${API_URL}${path}`, { ...init, credentials: "include" });
}

export async function fetchJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchApi(path, init);
  const payload = await fetchJsonSafely(response);
  if (!response.ok) {
    throw new ApiRequestError(response.status, path, payload);
  }
  return payload as T;
}
