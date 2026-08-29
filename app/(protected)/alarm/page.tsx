import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { alarmApi } from '@/feat/alarm/api';
import { AlarmClient } from './client';

export default async function AlarmPage() {
  const [session, alarms] = await Promise.all([
    getSession(),
    alarmApi.list({ pageSize: 100 }),
  ]);

  return (
    <>
      <Header breadcrumb={['Notification']} user={session!} />
      <AlarmClient initialData={alarms.data} />
    </>
  );
}
