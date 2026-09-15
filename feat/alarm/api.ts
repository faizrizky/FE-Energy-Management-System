import { http } from '@/lib/http';
import type { AlarmListDTO, AlarmListParams } from './dto';

export const alarmApi = {
  /**
   * GET /alarms dari server (tanpa cache). Backend udah nggak punya endpoint
   * ini, jadi pemanggilnya selalu dapet [].
   *
   * Dipake di: alarm/page.tsx → loadAlarms, components/shared/header.tsx →
   *   loadRecentAlarms.
   */
  list: ({ page = 0, pageSize = 20 }: AlarmListParams = {}) =>
    http<AlarmListDTO>(`/alarms?page=${page}&pageSize=${pageSize}`, {
      cache: 'no-store',
    }),
};
