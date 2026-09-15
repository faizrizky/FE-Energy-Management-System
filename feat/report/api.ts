import { http } from '@/lib/http';
import type { ReportDeviceRowDTO, ReportExportParams } from './dto';

/**
 * Nyusun query string filter laporan: from & to selalu ada, roomId & deviceId
 * cuma ditambahin kalo diisi.
 *
 * Dipake di: reportApi.getSummary (file ini).
 */
function buildQuery({ from, to, roomId, deviceId }: ReportExportParams) {
  const query = new URLSearchParams({ from, to });
  if (roomId) query.set('roomId', roomId);
  if (deviceId) query.set('deviceId', deviceId);
  return query.toString();
}

export const reportApi = {
  /**
   * GET /reports/summary dari server (tanpa cache).
   *
   * Dipake di: report/page.tsx.
   */
  getSummary: (params: ReportExportParams) =>
    http<ReportDeviceRowDTO[]>(`/reports/summary?${buildQuery(params)}`, {
      cache: 'no-store',
    }),
};
