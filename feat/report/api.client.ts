import { api } from '@/lib/axios';
import type { ReportExportParams } from './dto';

export const reportClientApi = {
  exportCsv: async ({ from, to, roomId, deviceId }: ReportExportParams) => {
    const response = await api.get('/reports/export', {
      params: { from, to, roomId, deviceId, format: 'csv' },
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
