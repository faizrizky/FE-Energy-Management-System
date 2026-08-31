// app/(protected)/dashboard/page.tsx
import { Zap, Router, Smartphone } from 'lucide-react';
import { Header } from '@/components/shared/header';
import { AnalyticCard } from '@/components/shared/analytic-card';
import { getSession } from '@/lib/auth';
import { dashboardApi } from '@/feat/dashboard/api';
import { scheduleApi } from '@/feat/schedule/api';
import { formatKwh, formatNumber } from '@/lib/utils';
import { DashboardSearch, DashboardTabs } from './client';

export default async function DashboardPage() {
  const [
    session,
    summary,
    timelineToday,
    timelineWeek,
    timelineMonth,
    timelineYear,
    riskyToday,
    riskyWeek,
    riskyMonth,
    riskyYear,
    schedules,
  ] = await Promise.all([
    getSession(),
    dashboardApi.getSummary(),
    dashboardApi.getEnergyUsageTimeline('today'),
    dashboardApi.getEnergyUsageTimeline('last_week'),
    dashboardApi.getEnergyUsageTimeline('last_month'),
    dashboardApi.getEnergyUsageTimeline('last_year'),
    dashboardApi.getTopRiskyRooms('today'),
    dashboardApi.getTopRiskyRooms('last_week'),
    dashboardApi.getTopRiskyRooms('last_month'),
    dashboardApi.getTopRiskyRooms('last_year'),
    scheduleApi.list(), // <- sumber sama kaya Schedule page, bukan endpoint dashboard sendiri
  ]);

  const timelineByRange = {
    today: timelineToday,
    last_week: timelineWeek,
    last_month: timelineMonth,
    last_year: timelineYear,
  };
  const riskyByRange = {
    today: riskyToday,
    last_week: riskyWeek,
    last_month: riskyMonth,
    last_year: riskyYear,
  };

  return (
    <>
      <Header breadcrumb={['Dashboard']} user={session!} />
      <div className="flex w-full flex-1 flex-col items-start gap-2.5 overflow-y-auto bg-slate-100 p-4 md:gap-8 md:bg-slate-50 md:p-8">
        <DashboardSearch />
        <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3 lg:gap-2.5">
          <AnalyticCard
            title="Energy usage"
            value={formatKwh(summary.energyUsage.totalKwh)}
            icon={Zap}
            helperText={`+${summary.energyUsage.changePercentFromYesterday}% from yesterday`}
            className="md:row-span-2 lg:row-span-1"
          />
          <AnalyticCard
            title="Gateway(s)"
            value={formatNumber(summary.gateways.total)}
            unit="Total"
            icon={Router}
            breakdown={[
              { label: `${summary.gateways.online} Online`, tone: 'success' },
              { label: `${summary.gateways.offline} Offline`, tone: 'error' },
            ]}
          />
          <AnalyticCard
            title="Device(s)"
            value={formatNumber(summary.devices.total)}
            unit="Total"
            icon={Smartphone}
            breakdown={[
              { label: `${summary.devices.online} Online`, tone: 'success' },
              { label: `${summary.devices.offline} Offline`, tone: 'error' },
            ]}
          />
        </div>
        <DashboardTabs
          timelineByRange={timelineByRange}
          riskyByRange={riskyByRange}
          schedules={schedules}
        />
      </div>
    </>
  );
}
