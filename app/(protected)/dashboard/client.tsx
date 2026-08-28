'use client';

import { useState } from 'react';
import { CalendarSearch } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { SegmentTabs } from '@/components/shared/segment-tabs';
import { EnergyUsageTimelineTab } from './_partials/energy-usage-timeline';
import { TopRiskyRoomsTab } from './_partials/top-risky-rooms';
import { ActiveSchedulesTab } from './_partials/active-schedules';
import type {
  EnergyUsageTimelineDTO,
  RiskyRoomDTO,
} from '@/feat/dashboard/dto';
import type { ScheduleDTO } from '@/feat/schedule/dto';

const TABS = [
  { value: 'energy-usage-timeline', label: 'Energy Usage Timeline' },
  { value: 'top-5-risky-rooms', label: 'Top 5 Risky Rooms' },
  { value: 'active-schedules', label: 'Active Schedules' },
] as const;

export function DashboardSearch() {
  const [search, setSearch] = useState('');
  return (
    <PageHeader
      title="Dashboard"
      description="Monitor energy usage and system status across your facility."
      actions={
        <div className="flex items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search room"
          />
          <button className="flex size-8 items-center justify-center rounded-md border border-slate-400 bg-white">
            <CalendarSearch className="size-4 text-slate-600" />
          </button>
        </div>
      }
    />
  );
}

interface DashboardTabsProps {
  timelineByRange: Record<string, EnergyUsageTimelineDTO>;
  riskyByRange: Record<string, RiskyRoomDTO[]>;
  schedules: ScheduleDTO[];
}

export function DashboardTabs({
  timelineByRange,
  riskyByRange,
  schedules,
}: DashboardTabsProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>(
    'energy-usage-timeline'
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <SegmentTabs
        value={tab}
        onValueChange={setTab}
        options={TABS.map((t) => ({ value: t.value, label: t.label }))}
      />
      {tab === 'energy-usage-timeline' && (
        <EnergyUsageTimelineTab dataByRange={timelineByRange} />
      )}
      {tab === 'top-5-risky-rooms' && (
        <TopRiskyRoomsTab dataByRange={riskyByRange} />
      )}
      {tab === 'active-schedules' && (
        <ActiveSchedulesTab schedules={schedules} />
      )}
    </div>
  );
}
