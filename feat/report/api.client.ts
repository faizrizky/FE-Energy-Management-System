import { api } from '@/lib/axios';
import type { ReportExportParams } from './dto';

const MIME: Record<'csv' | 'xlsx' | 'pdf', string> = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

export const reportClientApi = {
  export: async (
    { from, to, roomId, deviceId }: ReportExportParams,
    format: 'csv' | 'xlsx' | 'pdf'
  ) => {
    const response = await api.get('/reports/export', {
      params: { from, to, roomId, deviceId, format },
      responseType: 'blob',
    });
    return new Blob([response.data], { type: MIME[format] });
  },
};
