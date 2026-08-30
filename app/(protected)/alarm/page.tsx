import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { alarmApi } from '@/feat/alarm/api';
import type { AlarmDTO } from '@/feat/alarm/dto';
import { AlarmClient } from './client';

// Same reasoning as Header's loadRecentAlarms: ThingsBoard being
// unreachable must not 500 the whole page — degrade to an empty list
// and let the client show the "no notifications" empty state instead.
async function loadAlarms(): Promise<AlarmDTO[]> {
  try {
    const result = await alarmApi.list({ pageSize: 100 });
    return result.data;
  } catch {
    return [];
  }
}

export default async function AlarmPage() {
  const [session, alarms] = await Promise.all([getSession(), loadAlarms()]);

  return (
    <>
      <Header breadcrumb={['Notification']} user={session!} />
      <AlarmClient initialData={alarms} />
    </>
  );
}
