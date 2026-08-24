export interface DashboardSummaryDTO {
  energyUsage: { totalKwh: number; changePercentFromYesterday: number };
  gateways: { total: number; online: number; offline: number };
  devices: { total: number; online: number; offline: number };
}

export interface EnergyUsagePointDTO {
  hour: string; // "00.00"
  kwh: number;
}

export interface EnergyUsageTimelineDTO {
  range: "today" | "last_week" | "last_month" | "last_year";
  current: number;
  peak: number;
  average: number;
  points: EnergyUsagePointDTO[];
}

export interface RiskyRoomDTO {
  id: string;
  name: string;
  location: string;
  highestComponent: string;
  highestComponentKwh: number;
  peakUsageKwh: number;
  avgUsageKwh: number;
  totalUsageKwh: number;
}

export interface ActiveScheduleDTO {
  id: string;
  roomName: string;
  roomLocation: string;
  component: string;
  deviceEui: string;
  startDate: string;
  time: string;
  repeat: boolean;
}
