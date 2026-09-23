import { api } from '@/lib/axios';
import type {
  ScheduleDetailDTO,
  ScheduleDTO,
  ScheduleListResponseDTO,
} from './dto';
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

/**
 * Ubah nilai form (durationConstraint/repeatType lokal) jadi body API:
 * no-end -> endTime null, repeatDays cuma ikut kalo weekly.
 *
 * Dipake di: scheduleClientApi.create, scheduleClientApi.update (file ini).
 */
function toSchedulePayload(payload: ScheduleFormValues) {
  const { durationConstraint, ...rest } = payload;
  return {
    ...rest,
    description: payload.description || null,
    endTime: durationConstraint === 'end-at' ? payload.endTime : null,
    repeatDays: payload.repeatType === 'weekly' ? payload.repeatDays : [],
  };
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
   * GET /schedules/:id dari browser; ikut bawa riwayat eksekusi terbaru.
   *
   * Dipake di: schedule/client.tsx (modal detail).
   */
  getById: (scheduleId: string) =>
    api
      .get<ScheduleDetailDTO>(`/schedules/${scheduleId}`)
      .then((res) => res.data),

  /**
   * POST /schedules; durationConstraint 'no-end' -> endTime null, repeatDays
   * cuma dikirim kalo weekly. scheduledDate sengaja gak dikirim, backend
   * ngitung sendiri.
   *
   * Dipake di: schedule/_partials/modal.tsx.
   */
  create: (payload: ScheduleFormValues) =>
    api
      .post<ScheduleDTO>('/schedules', toSchedulePayload(payload))
      .then((res) => res.data),

  /**
   * PUT /schedules/:id dengan normalisasi yang sama kayak create.
   *
   * Dipake di: schedule/_partials/modal.tsx.
   */
  update: (scheduleId: string, payload: ScheduleFormValues) =>
    api
      .put<ScheduleDTO>(`/schedules/${scheduleId}`, toSchedulePayload(payload))
      .then((res) => res.data),

  /**
   * DELETE /schedules/:id.
   *
   * Dipake di: schedule/client.tsx.
   */
  remove: (scheduleId: string) =>
    api.delete(`/schedules/${scheduleId}`).then(() => undefined),
};
