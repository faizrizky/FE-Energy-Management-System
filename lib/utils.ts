import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Gabungin class Tailwind (clsx + tailwind-merge) biar class yang bentrok
 * nggak dobel.
 *
 * Dipake di: Hampir semua komponen di components/ui & components/shared.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka jadi "1,234.5 kWh" dengan jumlah desimal yang bisa diatur.
 *
 * Dipake di: Dashboard (page & partials), report/client, room-card, Room
 *   detail, column report/room-devices/rooms.
 */
export function formatKwh(value: number, fractionDigits = 1): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} kWh`;
}

/**
 * Format angka pake pemisah ribuan en-US.
 *
 * Dipake di: Halaman Alarm, Dashboard, Device, Gateway, Report, Role, Rooms,
 *   Schedule, User.
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Format tanggal jadi "September 14, 2026".
 *
 * Dipake di: Room detail, column gateway/report/user.
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
