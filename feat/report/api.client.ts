import { api } from '@/lib/axios';
import type { ReportDeviceRowDTO, ReportExportParams } from './dto';

const MIME: Record<'csv' | 'xlsx' | 'pdf', string> = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

export const reportClientApi = {
  /**
   * GET /reports/summary dari browser dengan filter tanggal, room, device.
   *
   * Dipake di: report/client.tsx.
   */
  getSummary: ({ from, to, roomId, deviceId }: ReportExportParams) =>
    api
      .get<ReportDeviceRowDTO[]>('/reports/summary', {
        params: { from, to, roomId, deviceId },
      })
      .then((res) => res.data),

  /**
   * GET /reports/export sebagai blob, terus dibungkus jadi Blob dengan MIME
   * sesuai format (csv/xlsx/pdf).
   *
   * Dipake di: report/client.tsx (tombol export).
   */
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
