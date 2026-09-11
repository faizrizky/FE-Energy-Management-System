import { http } from '@/lib/http';
import type { ReportDeviceRowDTO, ReportExportParams } from './dto';

function buildQuery({ from, to, roomId, deviceId }: ReportExportParams) {
  const query = new URLSearchParams({ from, to });
  if (roomId) query.set('roomId', roomId);
  if (deviceId) query.set('deviceId', deviceId);
  return query.toString();
}

export const reportApi = {
  getSummary: (params: ReportExportParams) =>
    http<ReportDeviceRowDTO[]>(`/reports/summary?${buildQuery(params)}`, {
      next: { revalidate: 60 },
    }),
};
