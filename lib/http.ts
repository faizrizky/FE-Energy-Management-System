/**
 * Thin fetch wrapper for Server Components / route handlers.
 * `axios.ts` is the client-side counterpart used inside "use client" files.
 */
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface HttpOptions {
  method?: HttpMethod;
  body?: unknown;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

export async function http<TResponse>(
  path: string,
  { method = "GET", body, cache, next }: HttpOptions = {}
): Promise<TResponse> {
  const token = (await cookies()).get("ems_token")?.value;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache,
    next,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.message ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<TResponse>;
}
