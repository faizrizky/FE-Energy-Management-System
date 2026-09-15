export type DevicePowerStatus = 'on' | 'off';

export type DeviceCommandStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'cancelled';

export interface DevicePendingCommandDTO {
  id: string;
  action: DevicePowerStatus;
  notes: string | null;
  requestedAt: string;
  deadline: string;
}

export interface DeviceCommandEventDTO {
  commandId: string;
  deviceId: string;
  deviceName: string | null;
  roomId: string;
  action: DevicePowerStatus;
  status: DeviceCommandStatus;
  notes: string | null;
  requestedAt: string;
  deadline: string;
  timestamp: string;
}

export interface DeviceCancelPowerResultDTO {
  deviceId: string;
  status: DevicePowerStatus;
  cancelled: DeviceCommandEventDTO[];
}

export interface DeviceRoomDTO {
  id: string;
  name: string;
  location: string | null;
}

export interface DeviceGatewayDTO {
  id: string;
  eui: string;
  name: string;
}

export interface DeviceDTO {
  id: string;
  eui: string;
  tbDeviceId: string | null;
  name: string;
  deviceType: string | null;
  intervalMinutes: number;
  status: DevicePowerStatus;
  lastSeenAt: string | null;
  roomId: string;
  gatewayId: string;
  room?: DeviceRoomDTO | null;
  gateway?: DeviceGatewayDTO | null;
  pendingCommand?: DevicePendingCommandDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceListResponseDTO {
  data: DeviceDTO[];
  page: number;
  rowsPerPage: number;
  totalRows: number;
  totalPages: number;
}

export interface DeviceDeviceSummaryDTO {
  id: string;
  eui: string;
  name: string;
  deviceType: string | null;
  status: string;
  roomId: string;
  gatewayId: string;
}

export interface DeviceDetailDTO extends DeviceDTO {
  devices: DeviceDeviceSummaryDTO[];
}

export interface DeviceStatusEventDTO {
  deviceId: string;
  eui: string;
  roomId: string;
  status: DevicePowerStatus;
  powerWatt?: number | null;
  usageKwh?: number | null;
  timestamp: string;
}
