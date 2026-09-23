export type ScheduleAction = 'on' | 'off';

export type ScheduleRepeatType = 'none' | 'daily' | 'weekly';

export interface ScheduleRoomDTO {
  id: string;
  name: string;
  location: string | null;
  _count?: { devices: number };
}

/**
 * Ringkasan aksi schedule dari backend: start = aksi pas jam mulai, end =
 * aksi kebalikannya pas jam selesai (null kalo schedule-nya gak punya
 * endTime). Diitung di backend biar aturannya satu sumber.
 */
export interface ScheduleActivityDTO {
  start: ScheduleAction;
  end: ScheduleAction | null;
}

export interface ScheduleCreatedByDTO {
  id: string;
  fullName: string;
  username: string;
  email: string;
}

export interface ScheduleDTO {
  id: string;

  name: string;
  description: string | null;

  roomId: string;

  action: ScheduleAction;

  scheduledDate: string;

  startTime: string;
  endTime: string | null;

  repeatType: ScheduleRepeatType;
  repeatDays: number[] | null;

  activity: ScheduleActivityDTO;

  status: string;

  createdById: string;

  createdAt: string;
  updatedAt: string;

  room?: ScheduleRoomDTO | null;
  createdBy?: ScheduleCreatedByDTO | null;
}

export type ScheduleExecutionStatus =
  | 'executed'
  | 'partial'
  | 'pending'
  | 'skipped'
  | 'failed';

/**
 * Satu kali eksekusi schedule (semua device di room pada menit yang sama),
 * udah diringkas backend jadi satu status + label.
 */
export interface ScheduleRecentActivityDTO {
  key: string;
  executedAt: string;
  date: string;
  time: string;
  action: ScheduleAction;
  status: ScheduleExecutionStatus;
  label: string;
}

/** Response GET /schedules/:id: schedule biasa plus riwayat eksekusi. */
export interface ScheduleDetailDTO extends ScheduleDTO {
  recentActivity: ScheduleRecentActivityDTO[];
}

export interface ScheduleListResponseDTO {
  data: ScheduleDTO[];
  page: number;
  rowsPerPage: number;
  totalRows: number;
  totalPages: number;
}
