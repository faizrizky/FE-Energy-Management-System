import { getAccessToken } from './auth';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface HttpOptions {
  method?: HttpMethod;
  body?: unknown;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

/**
 * Fetch dari server (server component) ke backend pake token dari cookie (atau
 * DEV_API_TOKEN kalo nggak ada), buka envelope data, dan lempar error pake
 * pesan dari backend (401 dikasih status khusus).
 *
 * Dipake di: semua file feat/<fitur>/api.ts (alarm, dashboard, device,
 *   gateway, report, role, rooms, schedule, user).
 */
export async function http<TResponse>(
  path: string,
  { method = 'GET', body, cache, next }: HttpOptions = {}
): Promise<TResponse> {
  const token = (await getAccessToken()) ?? process.env.DEV_API_TOKEN;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache,
    next,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));

    if (res.status === 401) {
      const err = new Error(
        'Sesi telah berakhir, silakan login kembali'
      ) as Error & {
        status?: number;
      };
      err.status = 401;
      throw err;
    }

    throw new Error(errorBody?.message ?? `Request failed: ${res.status}`);
  }

  const json = await res.json();
  return json.data as TResponse;
}
