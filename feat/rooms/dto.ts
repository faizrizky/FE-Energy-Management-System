export interface RoomListItemDTO {
  id: string;
  name: string;
  location: string;
  gatewayId: string;
  devicesOnline: number;
  devicesOffline: number;
  totalUsage24hKwh: number;
  isPowerOn: boolean;
  isCritical: boolean;
}

export interface RoomListResponseDTO {
  data: RoomListItemDTO[];
  page: number;
  rowsPerPage: number;
  totalRows: number;
  totalPages: number;
}

export interface RoomSummaryDTO {
  totalRooms: number;
  totalGateways: { total: number; online: number; offline: number };
  totalDevices: { total: number; online: number; offline: number };
}

export interface RoomDetailDTO {
  id: string;
  name: string;
  location: string;
  description: string;
  createdAt: string;
  lastUpdatedAt: string | null;
  isCritical: boolean;
  usage: {
    total24hKwh: number;
    avg24hKwh: number;
    peakKwh: number;
    highestComponent: { name: string; kwh: number };
  };
}

export interface RoomDeviceDTO {
  id: string;
  tbDeviceId: string;
  deviceEui: string;
  component: string;
  totalUsage24hKwh: number;
  intervalMinutes: number;
  isPowerOn: boolean;
}

export interface RoomDeviceLogEntryDTO {
  id: string;
  date: string;
  time: string;
  description: string;
  picName: string;
  picRole: string;
}
