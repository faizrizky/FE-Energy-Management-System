const API_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Ngubah Date jadi string YYYY-MM-DD pake tanggal lokal (bukan UTC), buat
 * param filter tanggal ke API. Sengaja nggak pake toISOString, soalnya jam
 * 00:00 WIB itu masih tanggal kemarin di UTC. Balikin undefined kalo kosong.
 *
 * Dipake di: device/client.tsx, gateway/client.tsx, report/client.tsx,
 *   report/page.tsx, rooms/client.tsx, rooms/detail/[roomId]/client.tsx,
 *   schedule/client.tsx, user/client.tsx.
 */
export function toApiDate(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Kebalikan toApiDate: baca string YYYY-MM-DD jadi Date jam 00:00 lokal.
 * Balikin undefined kalo kosong, formatnya salah, atau tanggalnya nggak ada
 * (misal 2026-02-31).
 *
 * Dipake di: rooms/client.tsx (isi awal filter tanggal dari URL).
 */
export function parseApiDate(value: string | null | undefined): Date | undefined {
  const match = value ? API_DATE_PATTERN.exec(value) : null;
  if (!match) return undefined;

  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  const isRealDate =
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d;
  return isRealDate ? date : undefined;
}
