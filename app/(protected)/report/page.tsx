import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { dashboardApi } from '@/feat/dashboard/api';
import { reportApi } from '@/feat/report/api';
import { ReportClient } from './client';

const REPORT_RANGE_DAYS = 30;

/**
 * Ngubah Date jadi YYYY-MM-DD (UTC).
 *
 * Dipake di: ReportPage (file ini).
 */
function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Server component halaman /report: ambil ringkasan dashboard, timeline, sama
 * laporan per device buat beberapa hari terakhir.
 *
 * Dipake di: Otomatis sama Next.js buat route /report.
 */
export default async function ReportPage() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - REPORT_RANGE_DAYS);
  const range = { from: toIsoDate(from), to: toIsoDate(to) };

  const [session, summary, timeline, rows] = await Promise.all([
    getSession(),
    dashboardApi.getSummary(),
    dashboardApi.getEnergyUsageTimeline('today'),
    reportApi.getSummary(range),
  ]);

  return (
    <>
      <Header breadcrumb={['Reports']} user={session!} />
      <ReportClient
        summary={summary}
        timeline={timeline}
        rows={rows}
        range={range}
      />
    </>
  );
}
