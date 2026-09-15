import { http } from '@/lib/http';
import type {
  DashboardSummaryDTO,
  EnergyUsageTimelineDTO,
  RiskyRoomDTO,
  ActiveScheduleDTO,
} from './dto';

export const dashboardApi = {
  getSummary: () =>
    http<DashboardSummaryDTO>('/dashboard/summary', { cache: 'no-store' }),

  getEnergyUsageTimeline: (range: EnergyUsageTimelineDTO['range'] = 'today') =>
    http<EnergyUsageTimelineDTO>(
      `/dashboard/energy-usage-timeline?range=${range}`,
      {
        cache: 'no-store',
      }
    ),

  getTopRiskyRooms: (
    range: 'today' | 'last_week' | 'last_month' | 'last_year' = 'today'
  ) =>
    http<RiskyRoomDTO[]>(`/dashboard/top-risky-rooms?range=${range}`, {
      cache: 'no-store',
    }),

  getActiveSchedules: (tab: 'active' | 'upcoming' = 'active') =>
    http<ActiveScheduleDTO[]>(`/dashboard/schedules?status=${tab}`, {
      cache: 'no-store',
    }),
};
