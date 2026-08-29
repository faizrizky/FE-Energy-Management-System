import { formatKwh, formatDate } from '@/lib/utils';
import type { ReportDeviceRowDTO } from '@/feat/report/dto';

export function getReportColumns() {
  return {
    device: (row: ReportDeviceRowDTO) => (
      <div className="flex flex-col gap-0.5 py-1">
        <span>{row.deviceName}</span>
        <span className="text-[10px] text-slate-500">{row.deviceEui}</span>
      </div>
    ),
    room: (row: ReportDeviceRowDTO) => (
      <div className="flex flex-col gap-0.5 py-1">
        <span>{row.roomName}</span>
        <span className="text-[10px] text-slate-500">
          {row.roomLocation ?? '-'}
        </span>
      </div>
    ),
    dateRange: (row: ReportDeviceRowDTO) => (
      <span className="text-slate-500">
        {formatDate(row.rangeStart)} - {formatDate(row.rangeEnd)}
      </span>
    ),
    start: (row: ReportDeviceRowDTO) => (
      <span className="text-slate-500">{formatKwh(row.startUsageKwh, 3)}</span>
    ),
    end: (row: ReportDeviceRowDTO) => (
      <span className="text-slate-500">{formatKwh(row.endUsageKwh, 3)}</span>
    ),
    usage: (row: ReportDeviceRowDTO) => (
      <span className="font-medium text-slate-950">
        {formatKwh(row.usageKwh, 3)}
      </span>
    ),
  };
}
