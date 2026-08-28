'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { SearchInput } from '@/components/shared/search-input';
import { EnergyUsageTimelineTab } from './_partials/energy-usage-timeline';
import { TopRiskyRoomsTab } from './_partials/top-risky-rooms';
import { ActiveSchedulesTab } from './_partials/active-schedules';
import { CalendarSearch } from 'lucide-react';

const TABS = [
  {
    value: 'energy-usage-timeline',
    label: 'Energy Usage Timeline',
  },
  {
    value: 'top-5-risky-rooms',
    label: 'Top 5 Risky Rooms',
  },
  {
    value: 'active-schedules',
    label: 'Active Schedules',
  },
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

export function DashboardTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>(
    'energy-usage-timeline'
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as typeof tab)}
      className="flex w-full flex-col gap-4"
    >
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="energy-usage-timeline">
        <EnergyUsageTimelineTab />
      </TabsContent>

      <TabsContent value="top-5-risky-rooms">
        <TopRiskyRoomsTab />
      </TabsContent>

      <TabsContent value="active-schedules">
        <ActiveSchedulesTab />
      </TabsContent>
    </Tabs>
  );
}
