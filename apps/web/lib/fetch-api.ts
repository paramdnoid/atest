import { apiFetch } from '@/lib/http-client';

export function fetchApi(path: string, init?: RequestInit): Promise<Response> {
  return apiFetch(path, init);
}
