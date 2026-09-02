import { http } from '@/lib/http';
import type { ScheduleDTO, ScheduleListResponseDTO } from './dto';

export interface ScheduleListParams {
  roomId?: string;
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const scheduleApi = {
  list: ({
    roomId,
    page = 1,
    rowsPerPage = 10,
    search,
  }: ScheduleListParams = {}) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
    });
    if (roomId) query.set('roomId', roomId);
    if (search) query.set('search', search);
    return http<ScheduleListResponseDTO>(`/schedules?${query.toString()}`, {
      next: { revalidate: 10 },
    });
  },

  getById: (scheduleId: string) =>
    http<ScheduleDTO>(`/schedules/${scheduleId}`, {
      next: {
        revalidate: 10,
      },
    }),
};
