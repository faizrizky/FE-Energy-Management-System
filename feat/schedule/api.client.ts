import { api } from '@/lib/axios';

import type { ScheduleDTO, ScheduleListResponseDTO } from './dto';

import type { ScheduleFormValues } from './schema';

export interface ScheduleListParams {
  roomId?: string;
  page?: number;
  rowsPerPage?: number;
  search?: string;
}

export const scheduleClientApi = {
  list: ({
    roomId,
    page = 1,
    rowsPerPage = 10,
    search,
  }: ScheduleListParams = {}) =>
    api
      .get<ScheduleListResponseDTO>('/schedules', {
        params: {
          roomId,
          page,
          rowsPerPage,
          search: search || undefined,
        },
      })
      .then((res) => res.data),

  getById: (scheduleId: string) =>
    api.get<ScheduleDTO>(`/schedules/${scheduleId}`).then((res) => res.data),

  create: (payload: ScheduleFormValues) =>
    api
      .post<ScheduleDTO>('/schedules', {
        ...payload,
        deviceId: payload.deviceId || null,
        endTime: payload.endTime || null,
        repeatDays: payload.repeatType === 'weekly' ? payload.repeatDays : [],
      })
      .then((res) => res.data),

  update: (scheduleId: string, payload: ScheduleFormValues) =>
    api
      .put<ScheduleDTO>(`/schedules/${scheduleId}`, {
        ...payload,
        deviceId: payload.deviceId || null,
        endTime: payload.endTime || null,
        repeatDays: payload.repeatType === 'weekly' ? payload.repeatDays : [],
      })
      .then((res) => res.data),

  remove: (scheduleId: string) =>
    api.delete(`/schedules/${scheduleId}`).then(() => undefined),
};
