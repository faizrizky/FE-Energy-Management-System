import { api } from '@/lib/axios';

export const alarmClientApi = {
  /**
   * POST /alarms/:id/ack buat nandain alarm udah dibaca. Endpoint-nya udah
   * nggak ada di backend.
   *
   * Dipake di: app/(protected)/alarm/client.tsx.
   */
  acknowledge: (alarmId: string) =>
    api
      .post<{ alarmId: string; status: string }>(`/alarms/${alarmId}/ack`)
      .then((res) => res.data),

  /**
   * POST /alarms/:id/clear buat nutup alarm. Endpoint-nya udah nggak ada di
   * backend.
   *
   * Dipake di: Belom dipake.
   */
  clear: (alarmId: string) =>
    api
      .post<{ alarmId: string; status: string }>(`/alarms/${alarmId}/clear`)
      .then((res) => res.data),
};
