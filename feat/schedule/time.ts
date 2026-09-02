// feat/schedule/time.ts
import type { ScheduleDTO } from './dto';

/** Parse scheduledDate (backend nyimpen sebagai UTC midnight) jadi "YYYY-MM-DD" tanpa geser timezone. */
export function toDateInputValue(value: string): string {
  return value.slice(0, 10); // ISO string udah "YYYY-MM-DDTHH:mm:ss.sssZ"
}

/** Format tampilan tanggal panjang, dibaca dari komponen UTC (bukan local time). */
export function formatScheduleDate(value: string): string {
  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function formatScheduleDateTime(value: string): string {
  const d = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function timeToMinutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

/** scheduledDate sebagai local midnight Date, dibaca dari komponen UTC backend. */
export function toLocalDateFromUTC(value: string): Date {
  const d = new Date(value);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function toDateKey(value: Date): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-');
}

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

export function formatTimeRange(
  startTime: string,
  endTime: string | null
): string {
  return endTime ? `${startTime} - ${endTime}` : startTime;
}

export function isWithinScheduleTime(
  schedule: ScheduleDTO,
  now: Date
): boolean {
  const current = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(schedule.startTime);

  if (schedule.endTime) {
    const end = timeToMinutes(schedule.endTime);
    if (end <= start) return current >= start || current <= end; // cross-midnight
    return current >= start && current <= end;
  }
  return current === start;
}

export function isCurrentlyActive(schedule: ScheduleDTO): boolean {
  if (schedule.status !== 'active') return false;

  const now = new Date();
  const date = toLocalDateFromUTC(schedule.scheduledDate);
  const today = toDateKey(now);
  const scheduleDate = toDateKey(date);

  if (schedule.repeatType === 'none') {
    if (scheduleDate !== today) return false;
  } else {
    if (date > startOfDay(now)) return false;
    if (schedule.repeatType === 'weekly') {
      const days = schedule.repeatDays ?? [];
      if (!days.includes(now.getDay())) return false;
    }
  }

  return isWithinScheduleTime(schedule, now);
}

export function getNextOccurrence(schedule: ScheduleDTO): Date | null {
  const now = new Date();
  const startDate = toLocalDateFromUTC(schedule.scheduledDate);
  const startMinutes = timeToMinutes(schedule.startTime);

  const createDate = (date: Date) => {
    const result = new Date(date);
    result.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    return result;
  };

  if (schedule.repeatType === 'none') {
    const occurrence = createDate(startDate);
    return occurrence > now ? occurrence : null;
  }

  if (startDate > startOfDay(now)) {
    const firstOccurrence = createDate(startDate);
    return firstOccurrence > now ? firstOccurrence : null;
  }

  if (schedule.repeatType === 'daily') {
    const today = createDate(startOfDay(now));
    if (today > now) return today;
    const tomorrow = new Date(startOfDay(now));
    tomorrow.setDate(tomorrow.getDate() + 1);
    return createDate(tomorrow);
  }

  if (schedule.repeatType === 'weekly') {
    const days = schedule.repeatDays ?? [];
    if (!days.length) return null;

    for (let offset = 0; offset < 8; offset += 1) {
      const candidate = new Date(startOfDay(now));
      candidate.setDate(candidate.getDate() + offset);
      if (candidate < startDate) continue;
      if (!days.includes(candidate.getDay())) continue;
      const occurrence = createDate(candidate);
      if (occurrence > now) return occurrence;
    }
  }

  return null;
}

export function isUpcoming(schedule: ScheduleDTO): boolean {
  if (schedule.status !== 'active') return false;
  const next = getNextOccurrence(schedule);
  return next ? next.getTime() > Date.now() : false;
}

export function isUpcomingWithin24Hours(schedule: ScheduleDTO): boolean {
  if (schedule.status !== 'active') return false;
  const next = getNextOccurrence(schedule);
  if (!next) return false;
  const diff = next.getTime() - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}
