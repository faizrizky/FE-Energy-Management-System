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
  status: string;
  lastSeenAt: string | null;
  roomId: string;
  gatewayId: string;
  room?: DeviceRoomDTO | null;
  gateway?: DeviceGatewayDTO | null;
  createdAt: string;
  updatedAt: string;
}
