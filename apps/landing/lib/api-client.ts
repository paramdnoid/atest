const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  // Client-side: credentials: "include" sends the cookie automatically
  return fetch(`${API_URL}${path}`, { ...init, credentials: "include" });
}
