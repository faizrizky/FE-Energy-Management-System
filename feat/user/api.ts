import { http } from '@/lib/http';
import type { UserSummaryDTO } from './dto';

/**
 * SERVER-ONLY (lib/http.ts, next/headers) — panggil dari Server Component saja.
 *
 * NOTE (security, di luar scope perubahan ini): backend `GET /users` saat ini
 * balikin row user MENTAH termasuk `passwordHash` dan object `role` penuh
 * (lihat user.usecase.js#listUsers — beda dengan getMe.usecase.js yang
 * eksplisit strip field sensitif). DTO di sini cuma ambil field yang aman
 * (id/fullName/username) di sisi frontend, tapi response mentahnya sendiri
 * tetap bocorin passwordHash ke siapa pun yang punya permission 'user:view'
 * (saat ini cuma role Administrator, sesuai seed data). Perlu diperbaiki di
 * user.usecase.js pas Fase 7 (User module) dikerjakan.
 */
export const usersApi = {
  list: () => http<UserSummaryDTO[]>('/users', { next: { revalidate: 60 } }),
};
