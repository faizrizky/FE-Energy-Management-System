import { api } from '@/lib/axios';

export const alarmClientApi = {
  acknowledge: (alarmId: string) =>
    api
      .post<{ alarmId: string; status: string }>(`/alarms/${alarmId}/ack`)
      .then((res) => res.data),

  clear: (alarmId: string) =>
    api
      .post<{ alarmId: string; status: string }>(`/alarms/${alarmId}/clear`)
      .then((res) => res.data),
};
