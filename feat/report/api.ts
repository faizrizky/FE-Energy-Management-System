import { http } from '@/lib/http';
import type { EnergyReadingDTO, ReportExportParams } from './dto';

function buildQuery({ from, to, roomId, deviceId }: ReportExportParams) {
  const query = new URLSearchParams({ from, to });
  if (roomId) query.set('roomId', roomId);
  if (deviceId) query.set('deviceId', deviceId);
  return query.toString();
}

export const reportApi = {
  // Same endpoint the "Export as CSV" button hits client-side
  // (GET /reports/export) — called here without format=csv so the
  // response stays JSON and can be aggregated for the table.
  listReadings: (params: ReportExportParams) =>
    http<EnergyReadingDTO[]>(`/reports/export?${buildQuery(params)}`, {
      next: { revalidate: 60 },
    }),
};
