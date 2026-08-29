import { api } from '@/lib/axios';

import type { ScheduleDTO } from './dto';

import type { ScheduleFormValues } from './schema';

export const scheduleClientApi = {
  list: (roomId?: string) =>
    api
      .get<
        ScheduleDTO[]
      >(roomId ? `/schedules?roomId=${encodeURIComponent(roomId)}` : '/schedules')
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
