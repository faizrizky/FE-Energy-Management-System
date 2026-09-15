import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';

import { roomsApi } from '@/feat/rooms/api';
import { devicesApi } from '@/feat/device/api';
import { scheduleApi } from '@/feat/schedule/api';

import { ScheduleClient } from './client';

/**
 * Server component halaman /schedule: ambil schedule aktif, total semua &
 * upcoming, sama room & device buat form.
 *
 * Dipake di: Otomatis sama Next.js buat route /schedule.
 */
export default async function SchedulePage() {
  const [session, activeSchedules, overallMeta, upcomingMeta, rooms, devices] =
    await Promise.all([
      getSession(),
      scheduleApi.list({ page: 1, rowsPerPage: 10, status: 'active' }),
      scheduleApi.list({ page: 1, rowsPerPage: 1 }),
      scheduleApi.list({ page: 1, rowsPerPage: 1, status: 'upcoming' }),
      roomsApi.listSummary(),
      devicesApi.list(),
    ]);

  return (
    <>
      <Header breadcrumb={['Schedule']} user={session!} />
      <ScheduleClient
        initialData={activeSchedules}
        initialOverallTotal={overallMeta.totalRows}
        initialUpcomingTotal={upcomingMeta.totalRows}
        rooms={rooms}
        devices={devices.data}
      />
    </>
  );
}
