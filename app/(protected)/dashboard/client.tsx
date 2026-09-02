'use client';

import { useState } from 'react';
import { CalendarSearch } from 'lucide-react';
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
    <div className="flex w-full flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[36px] font-bold leading-[44px] tracking-[-0.72px] text-emerald-500">
          Dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Monitor energy usage and system status across your facility.
        </p>
      </div>
      <div className="flex w-full items-center gap-2 md:w-auto">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search room"
          className="flex-1 md:flex-none"
        />
        <button className="flex size-11 shrink-0 items-center justify-center rounded-md border border-slate-400 bg-white md:size-8">
          <CalendarSearch className="size-4 text-slate-600" />
        </button>
      </div>
    </div>
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
