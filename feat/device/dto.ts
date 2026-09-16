export type DevicePowerStatus = 'on' | 'off';

export type DeviceCommandStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'skipped';

export interface DevicePendingCommandDTO {
  id: string;
  action: DevicePowerStatus;
  notes: string | null;
  requestedAt: string;
  deadline: string;
  resync?: DeviceResyncStateDTO | null;
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
  sentAt?: string | null;
  statusUncertain?: boolean;
  resync?: DeviceResyncStateDTO | null;
  timestamp: string;
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
  name: string;
  deviceType: string | null;
  intervalMinutes: number;
  status: DevicePowerStatus;
  lastSeenAt: string | null;
  roomId: string;
  gatewayId: string;
  statusUncertain?: boolean;
  statusResync?: DeviceResyncStateDTO | null;
  isOnline?: boolean;
  onlineUntil?: string | null;
  chirpstack?: DeviceChirpstackInfoDTO | null;
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

export interface DeviceResyncStateDTO {
  attempt: number;
  maxAttempts: number | null;
  nextRetryAt: string | null;
}

export interface DeviceResyncEventDTO {
  deviceId: string;
  eui: string;
  roomId: string;
  resync: DeviceResyncStateDTO | null;
  timestamp: string;
}

export interface DeviceChirpstackInfoDTO {
  registered: boolean;
  name: string | null;
  deviceProfileId?: string | null;
  lastSeenAt: string | null;
}

export interface DeviceChirpstackInfoDTO {
  registered: boolean;
  name: string | null;
  deviceProfileId?: string | null;
  lastSeenAt: string | null;
}

export interface DeviceStatusEventDTO {
  deviceId: string;
  eui: string;
  roomId: string;
  status: DevicePowerStatus;
  powerWatt?: number | null;
  usageKwh?: number | null;
  source?: 'telemetry' | 'command';
  online?: boolean;
  timestamp: string;
}
