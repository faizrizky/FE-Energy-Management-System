import type {
  DeviceCommandEventDTO,
  DevicePendingCommandDTO,
  DevicePowerStatus,
} from '@/feat/device/dto';

export interface RoomListItemDTO {
  id: string;
  name: string;
  location: string;
  gatewayId: string;
  devicesOnline: number;
  devicesOffline: number;
  totalUsage24hKwh: number;
  isPowerOn: boolean;
  pendingCommandCount?: number;
  isCritical: boolean;
}

export interface RoomPowerResultDTO {
  roomId: string;
  action: DevicePowerStatus;
  results: DeviceCommandEventDTO[];
  summary: { total: number; pending: number; failed: number };
}

export interface RoomListResponseDTO {
  data: RoomListItemDTO[];
  page: number;
  rowsPerPage: number;
  totalRows: number;
  totalPages: number;
}

export interface RoomDeviceListResponseDTO {
  data: RoomDeviceDTO[];
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

export interface RoomDTO {
  id: string;
  name: string;
  location: string;
  picName: string | null;
  picPhone: string | null;
  description: string | null;
  isCritical: boolean;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomDetailDTO extends RoomDTO {
  lastUpdatedAt: string | null;
  usage: {
    total24hKwh: number;
    avg24hKwh: number;
    peakKwh: number;
    highestComponent: { name: string; kwh: number };
  };
  devices?: RoomDeviceListResponseDTO;
}

export interface RoomDeviceDTO {
  id: string;
  tbDeviceId: string;
  deviceEui: string;
  deviceType: string;
  totalUsage24hKwh: number;
  intervalMinutes: number;
  isPowerOn: boolean;
  pendingCommand?: DevicePendingCommandDTO | null;
}

export interface RoomDeviceLogEntryDTO {
  id: string;
  date: string;
  time: string;
  description: string;
  picName: string;
  picRole: string;
}

export interface RoomUsageSummaryDTO {
  total24hKwh: number;
  avg24hKwh: number;
  peakKwh: number;
  highestComponent: { name: string; kwh: number };
}
