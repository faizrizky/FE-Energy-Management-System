import { Zap, Router, Smartphone } from "lucide-react";
import { Header } from "@/components/shared/header";
import { AnalyticCard } from "@/components/shared/analytic-card";
import { getSession } from "@/lib/auth";
import { dashboardApi } from "@/feat/dashboard/api";
import { formatKwh, formatNumber } from "@/lib/utils";
import { DashboardSearch, DashboardTabs } from "./client";

export default async function DashboardPage() {
  const [session, summary] = await Promise.all([
    getSession(),
    dashboardApi.getSummary(),
  ]);

  return (
    <>
      <Header breadcrumb={["Dashboard"]} user={session!} />

      <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
        <DashboardSearch />

        <div className="flex w-full items-start gap-2.5">
          <AnalyticCard
            title="Energy usage"
            value={formatKwh(summary.energyUsage.totalKwh)}
            icon={Zap}
            helperText={`+${summary.energyUsage.changePercentFromYesterday}% from yesterday`}
          />

          <AnalyticCard
            title="Gateway(s)"
            value={formatNumber(summary.gateways.total)}
            unit="Total"
            icon={Router}
            breakdown={[
              {
                label: `${summary.gateways.online} Online`,
                tone: "success",
              },
              {
                label: `${summary.gateways.offline} Offline`,
                tone: "error",
              },
            ]}
          />

          <AnalyticCard
            title="Device(s)"
            value={formatNumber(summary.devices.total)}
            unit="Total"
            icon={Smartphone}
            breakdown={[
              {
                label: `${summary.devices.online} Online`,
                tone: "success",
              },
              {
                label: `${summary.devices.offline} Offline`,
                tone: "error",
              },
            ]}
          />
        </div>

        <DashboardTabs />
      </div>
    </>
  );
}