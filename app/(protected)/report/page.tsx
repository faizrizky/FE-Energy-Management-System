import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { dashboardApi } from '@/feat/dashboard/api';
import { devicesApi } from '@/feat/device/api';
import { reportApi } from '@/feat/report/api';
import type { EnergyReadingDTO, ReportDeviceRowDTO } from '@/feat/report/dto';
import type { DeviceDTO } from '@/feat/device/dto';
import { ReportClient } from './client';

const REPORT_RANGE_DAYS = 30;

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * BACKEND GAP: /reports/export returns one row per raw reading
 * (roomName + deviceName only, no ids) — it wasn't built with a
 * "per device summary" shape in mind. We group readings per device+room
 * and derive start/end/usage from the first and last reading in range,
 * then join back to devicesApi.list() to recover the EUI and room
 * location for display. Once a proper aggregated endpoint exists this
 * function goes away and the table just maps the response directly.
 */
function aggregateReadings(
  readings: EnergyReadingDTO[],
  devices: DeviceDTO[]
): ReportDeviceRowDTO[] {
  const deviceByName = new Map(devices.map((d) => [d.name, d]));
  const grouped = new Map<string, EnergyReadingDTO[]>();

  for (const reading of readings) {
    const key = `${reading.roomName}::${reading.deviceName}`;
    const list = grouped.get(key) ?? [];
    list.push(reading);
    grouped.set(key, list);
  }

  return Array.from(grouped.values())
    .map((list) => {
      const sorted = [...list].sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const device = deviceByName.get(first.deviceName);
      const startUsageKwh = first.usageKwh ?? 0;
      const endUsageKwh = last.usageKwh ?? 0;

      return {
        key: `${first.roomName}::${first.deviceName}`,
        deviceEui: device?.eui ?? '-',
        deviceName: first.deviceName,
        roomName: first.roomName,
        roomLocation: device?.room?.location ?? null,
        rangeStart: first.recordedAt,
        rangeEnd: last.recordedAt,
        startUsageKwh,
        endUsageKwh,
        usageKwh: Number((endUsageKwh - startUsageKwh).toFixed(3)),
      };
    })
    .sort((a, b) => b.usageKwh - a.usageKwh);
}

export default async function ReportPage() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - REPORT_RANGE_DAYS);
  const range = { from: toIsoDate(from), to: toIsoDate(to) };

  const [session, summary, timeline, readings, devices] = await Promise.all([
    getSession(),
    dashboardApi.getSummary(),
    dashboardApi.getEnergyUsageTimeline('today'),
    reportApi.listReadings(range),
    devicesApi.list(),
  ]);

  const rows = aggregateReadings(readings, devices);

  return (
    <>
      <Header breadcrumb={['Reports']} user={session!} />
      <ReportClient
        summary={summary}
        timeline={timeline}
        rows={rows}
        range={range}
      />
    </>
  );
}
