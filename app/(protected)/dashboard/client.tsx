"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EnergyUsageTimelineTab } from "./_partials/energy-usage-timeline";
import { TopRiskyRoomsTab } from "./_partials/top-risky-rooms";
import { ActiveSchedulesTab } from "./_partials/active-schedules";

const TABS = [
  { value: "energy-usage-timeline", label: "Energy Usage Timeline" },
  { value: "top-5-risky-rooms", label: "Top 5 Risky Rooms" },
  { value: "active-schedules", label: "Active Schedules" },
] as const;

/**
 * Client boundary that owns which dashboard tab is active. Kept separate
 * from page.tsx so the summary cards above can stay a server component.
 */
export function DashboardTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("energy-usage-timeline");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex w-full flex-col gap-4">
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
