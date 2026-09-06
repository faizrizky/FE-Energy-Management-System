export function toDateInputValue(value: string): string {
  return value.slice(0, 10);
}

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
