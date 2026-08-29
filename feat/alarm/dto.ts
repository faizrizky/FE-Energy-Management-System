export type AlarmStatus = 'ACTIVE_UNACK' | 'ACTIVE_ACK';

export interface AlarmDTO {
  id: string;
  type: string;
  severity: string;
  status: AlarmStatus;
  createdTime: number;
  ackTime: number | null;
  clearTime: number | null;
  deviceId: string | null;
  deviceName: string;
  roomId: string | null;
  roomName: string;
  isMapped: boolean;
}

export interface AlarmListDTO {
  data: AlarmDTO[];
  page: number;
  totalPages: number;
  totalElements: number;
  hasNext: boolean;
}

export interface AlarmListParams {
  page?: number;
  pageSize?: number;
}
