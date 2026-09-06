import { http } from '@/lib/http';
import type { ScheduleDTO, ScheduleListResponseDTO } from './dto';

export interface ScheduleListParams {
  roomId?: string;
  status?: 'active' | 'upcoming';
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const scheduleApi = {
  list: ({
    roomId,
    status,
    page = 1,
    rowsPerPage = 10,
    search,
  }: ScheduleListParams = {}) => {
    const query = new URLSearchParams({
      page: String(page),
      rowsPerPage: String(rowsPerPage),
    });
    if (roomId) query.set('roomId', roomId);
    if (status) query.set('status', status);
    if (search) query.set('search', search);
    return http<ScheduleListResponseDTO>(`/schedules?${query.toString()}`, {
      next: { revalidate: 10 },
    });
  },

  getById: (scheduleId: string) =>
    http<ScheduleDTO>(`/schedules/${scheduleId}`, {
      next: { revalidate: 10 },
    }),
};
