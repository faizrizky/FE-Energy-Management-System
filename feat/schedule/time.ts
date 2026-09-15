/**
 * Ambil bagian YYYY-MM-DD dari string ISO buat isi input date.
 *
 * Dipake di: schedule/_partials/modal.tsx.
 */
export function toDateInputValue(value: string): string {
  return value.slice(0, 10);
}

/**
 * Format tanggal schedule pake zona UTC (misal "Sep 20, 2026"); "-" kalo nggak
 * valid.
 *
 * Dipake di: dashboard/_partials/active-schedules.tsx, schedule
 *   detail-modal/schedule-card, column/schedule.tsx.
 */
export function formatScheduleDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/**
 * Format tanggal + jam pake zona UTC (misal "Sep 20, 2026, 01:05 PM").
 *
 * Dipake di: schedule/_partials/detail-modal.tsx.
 */
export function formatScheduleDateTime(value: string): string {
  const d = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(d);
}

/**
 * Ngubah angka hari 0–6 jadi nama hari (Minggu = 0); "-" kalo di luar itu.
 *
 * Dipake di: schedule/_partials/detail-modal.tsx (formatRepeat).
 */
export function dayName(day: number): string {
  const names = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return names[day] ?? '-';
}

/**
 * Gabung jam mulai & selesai jadi "08:00 - 17:00", atau jam mulai aja kalo
 * nggak ada jam selesai.
 *
 * Dipake di: schedule/_partials/schedule-card.tsx, column/schedule.tsx.
 */
export function formatTimeRange(
  startTime: string,
  endTime: string | null
): string {
  return endTime ? `${startTime} - ${endTime}` : startTime;
}
