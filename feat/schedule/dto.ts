export type ScheduleAction = "on" | "off";

export type ScheduleRepeatType =
  | "none"
  | "daily"
  | "weekly";

export interface ScheduleRoomDTO {
  id: string;
  name: string;
  location: string | null;
}

export interface ScheduleDeviceDTO {
  id: string;
  eui: string;
  name: string;
  deviceType: string | null;
  roomId: string;
  status: string;
}

export interface ScheduleCreatedByDTO {
  id: string;
  fullName: string;
  username: string;
  email: string;
}

export interface ScheduleDTO {
  id: string;

  roomId: string;
  deviceId: string | null;

  action: ScheduleAction;

  scheduledDate: string;

  startTime: string;
  endTime: string | null;

  repeatType: ScheduleRepeatType;
  repeatDays: number[] | null;

  status: string;

  createdById: string;

  createdAt: string;
  updatedAt: string;

  room?: ScheduleRoomDTO | null;
  device?: ScheduleDeviceDTO | null;
  createdBy?: ScheduleCreatedByDTO | null;
}

export interface ScheduleListResponseDTO {
  data: ScheduleDTO[];
}