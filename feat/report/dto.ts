export interface EnergyReadingDTO {
  recordedAt: string;
  roomName: string;
  deviceName: string;
  powerWatt: number | null;
  usageKwh: number | null;
}

export interface ReportExportParams {
  from: string;
  to: string;
  roomId?: string;
  deviceId?: string;
}

/**
 * One row per device+room in the Reports table. The backend's
 * /reports/export endpoint only returns raw per-reading rows (no device
 * id/eui) — this shape is what the Reports page derives after grouping
 * those readings, joined with devicesApi.list() for the EUI/location.
 */
export interface ReportDeviceRowDTO {
  key: string;
  deviceEui: string;
  deviceName: string;
  roomName: string;
  roomLocation: string | null;
  rangeStart: string;
  rangeEnd: string;
  startUsageKwh: number;
  endUsageKwh: number;
  usageKwh: number;
}
