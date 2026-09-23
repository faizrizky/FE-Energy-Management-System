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
 * Format timestamp jadi tanggal panjang di zona waktu browser (misal "April
 * 12, 2026"). Sengaja nggak UTC kayak formatScheduleDate: scheduledDate itu
 * cuma tanggal, sedangkan createdAt/updatedAt itu waktu beneran.
 *
 * Dipake di: schedule/_partials/detail-modal.tsx.
 */
export function formatLongDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
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
