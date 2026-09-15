import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { alarmApi } from '@/feat/alarm/api';
import type { AlarmDTO } from '@/feat/alarm/dto';
import { AlarmClient } from './client';

// Same reasoning as Header's loadRecentAlarms: ThingsBoard being
// unreachable must not 500 the whole page — degrade to an empty list
// and let the client show the "no notifications" empty state instead.
/**
 * Ngambil 100 alarm terakhir. Kalo gagal balikin [] biar halamannya tetep
 * kebuka.
 *
 * Dipake di: AlarmPage (file ini).
 */
async function loadAlarms(): Promise<AlarmDTO[]> {
  try {
    const result = await alarmApi.list({ pageSize: 100 });
    return result.data;
  } catch {
    return [];
  }
}

/**
 * Server component halaman /alarm: ambil session & alarm, terus render Header
 * + AlarmClient.
 *
 * Dipake di: Otomatis sama Next.js buat route /alarm. Nggak ada di menu
 *   sidebar.
 */
export default async function AlarmPage() {
  const [session, alarms] = await Promise.all([getSession(), loadAlarms()]);

  return (
    <>
      <Header breadcrumb={['Notification']} user={session!} />
      <AlarmClient initialData={alarms} />
    </>
  );
}
