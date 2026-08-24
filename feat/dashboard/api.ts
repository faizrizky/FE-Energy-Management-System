import { http } from "@/lib/http";
import type {
  DashboardSummaryDTO,
  EnergyUsageTimelineDTO,
  RiskyRoomDTO,
  ActiveScheduleDTO,
} from "./dto";

/**
 * Server-side data access for the Dashboard page. Each function maps 1:1
 * to a backend endpoint (see EMS API: /dashboard/*) — keep this the only
 * place that knows those paths.
 */
export const dashboardApi = {
  getSummary: () => http<DashboardSummaryDTO>("/dashboard/summary", { next: { revalidate: 30 } }),

  getEnergyUsageTimeline: (range: EnergyUsageTimelineDTO["range"] = "today") =>
    http<EnergyUsageTimelineDTO>(`/dashboard/energy-usage-timeline?range=${range}`, {
      next: { revalidate: 30 },
    }),

  getTopRiskyRooms: (range: "today" | "last_week" | "last_month" | "last_year" = "today") =>
    http<RiskyRoomDTO[]>(`/dashboard/top-risky-rooms?range=${range}`, { next: { revalidate: 30 } }),

  getActiveSchedules: (tab: "active" | "upcoming" = "active") =>
    http<ActiveScheduleDTO[]>(`/dashboard/schedules?status=${tab}`, { next: { revalidate: 30 } }),
};
