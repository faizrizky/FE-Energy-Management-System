import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';

import { roomsApi } from '@/feat/rooms/api';
import { devicesApi } from '@/feat/device/api';
import { scheduleApi } from '@/feat/schedule/api';

import { ScheduleClient } from './client';

export default async function SchedulePage() {
  const [session, schedules, rooms, devices] = await Promise.all([
    getSession(),
    scheduleApi.list(),
    roomsApi.list({ page: 1, rowsPerPage: 10 }),
    devicesApi.list(),
  ]);

  return (
    <>
      <Header breadcrumb={['Schedule']} user={session!} />
      <ScheduleClient
        initialData={schedules}
        rooms={rooms.data}
        devices={devices.data}
      />
    </>
  );
}
