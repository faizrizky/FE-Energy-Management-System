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

/** Shape returned by create/update — matches prisma.room row, no usage stats. */
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
