import { http } from '@/lib/http';
import type { AlarmListDTO, AlarmListParams } from './dto';

export const alarmApi = {
  list: ({ page = 0, pageSize = 20 }: AlarmListParams = {}) =>
    http<AlarmListDTO>(`/alarms?page=${page}&pageSize=${pageSize}`, {
      next: { revalidate: 15 },
    }),
};
