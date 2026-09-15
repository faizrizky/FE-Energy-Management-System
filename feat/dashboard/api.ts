import { http } from '@/lib/http';
import type {
  DashboardSummaryDTO,
  EnergyUsageTimelineDTO,
  RiskyRoomDTO,
  ActiveScheduleDTO,
} from './dto';

export const dashboardApi = {
  /**
   * GET /dashboard/summary dari server (tanpa cache).
   *
   * Dipake di: dashboard/page.tsx, report/page.tsx.
   */
  getSummary: () =>
    http<DashboardSummaryDTO>('/dashboard/summary', { cache: 'no-store' }),

  /**
   * GET /dashboard/energy-usage-timeline per range dari server (tanpa cache).
   *
   * Dipake di: dashboard/page.tsx, report/page.tsx.
   */
  getEnergyUsageTimeline: (range: EnergyUsageTimelineDTO['range'] = 'today') =>
    http<EnergyUsageTimelineDTO>(
      `/dashboard/energy-usage-timeline?range=${range}`,
      {
        cache: 'no-store',
      }
    ),

  /**
   * GET /dashboard/top-risky-rooms per range dari server (tanpa cache).
   *
   * Dipake di: dashboard/page.tsx.
   */
  getTopRiskyRooms: (
    range: 'today' | 'last_week' | 'last_month' | 'last_year' = 'today'
  ) =>
    http<RiskyRoomDTO[]>(`/dashboard/top-risky-rooms?range=${range}`, {
      cache: 'no-store',
    }),

  /**
   * GET /dashboard/schedules active/upcoming dari server (tanpa cache).
   *
   * Dipake di: dashboard/page.tsx.
   */
  getActiveSchedules: (tab: 'active' | 'upcoming' = 'active') =>
    http<ActiveScheduleDTO[]>(`/dashboard/schedules?status=${tab}`, {
      cache: 'no-store',
    }),
};
