import { api } from '@/lib/axios';
import type { ScheduleDTO, ScheduleListResponseDTO } from './dto';
import type { ScheduleFormValues } from './schema';

export interface ScheduleListParams {
  roomId?: string;
  status?: 'active' | 'upcoming';
  page?: number;
  rowsPerPage?: number;
  search?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
}

export const scheduleClientApi = {
  /**
   * GET /schedules dari browser dengan filter room, status, search, tanggal, &
   * paginasi.
   *
   * Dipake di: schedule/client.tsx.
   */
  list: ({
    roomId,
    status,
    page = 1,
    rowsPerPage = 10,
    search,
    scheduledFrom,
    scheduledTo,
  }: ScheduleListParams = {}) =>
    api
      .get<ScheduleListResponseDTO>('/schedules', {
        params: {
          roomId,
          status,
          page,
          rowsPerPage,
          search: search || undefined,
          scheduledFrom,
          scheduledTo,
        },
      })
      .then((res) => res.data),

  /**
   * GET /schedules/:id dari browser.
   *
   * Dipake di: schedule/client.tsx (modal detail).
   */
  getById: (scheduleId: string) =>
    api.get<ScheduleDTO>(`/schedules/${scheduleId}`).then((res) => res.data),

  /**
   * POST /schedules; deviceId/endTime kosong dikirim null, repeatDays cuma
   * dikirim kalo weekly.
   *
   * Dipake di: schedule/_partials/modal.tsx.
   */
  create: (payload: ScheduleFormValues) =>
    api
      .post<ScheduleDTO>('/schedules', {
        ...payload,
        deviceId: payload.deviceId || null,
        endTime: payload.endTime || null,
        repeatDays: payload.repeatType === 'weekly' ? payload.repeatDays : [],
      })
      .then((res) => res.data),

  /**
   * PUT /schedules/:id dengan normalisasi yang sama kayak create.
   *
   * Dipake di: schedule/_partials/modal.tsx.
   */
  update: (scheduleId: string, payload: ScheduleFormValues) =>
    api
      .put<ScheduleDTO>(`/schedules/${scheduleId}`, {
        ...payload,
        deviceId: payload.deviceId || null,
        endTime: payload.endTime || null,
        repeatDays: payload.repeatType === 'weekly' ? payload.repeatDays : [],
      })
      .then((res) => res.data),

  /**
   * DELETE /schedules/:id.
   *
   * Dipake di: schedule/client.tsx.
   */
  remove: (scheduleId: string) =>
    api.delete(`/schedules/${scheduleId}`).then(() => undefined),
};
