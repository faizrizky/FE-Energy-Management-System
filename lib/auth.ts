import { cookies } from 'next/headers';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'PJ Gedung' | 'Komandan';
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get('ems_token')?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const { data: user } = await res.json();
    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
}
