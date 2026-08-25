import { http } from "@/lib/http";
import type {
  ScheduleDTO,
} from "./dto";

export interface ScheduleListParams {
  roomId?: string;
}

export const scheduleApi = {
  list: ({
    roomId,
  }: ScheduleListParams = {}) => {
    const query = new URLSearchParams();

    if (roomId) {
      query.set("roomId", roomId);
    }

    const suffix = query.toString()
      ? `?${query.toString()}`
      : "";

    return http<ScheduleDTO[]>(
      `/schedules${suffix}`,
      {
        next: {
          revalidate: 10,
        },
      }
    );
  },

  getById: (scheduleId: string) =>
    http<ScheduleDTO>(
      `/schedules/${scheduleId}`,
      {
        next: {
          revalidate: 10,
        },
      }
    ),
};