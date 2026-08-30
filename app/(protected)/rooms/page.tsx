import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { roomsApi } from '@/feat/rooms/api';
import { usersApi } from '@/feat/user/api';
import { RoomsClient } from './client';

export default async function RoomsPage() {
  const [session, summary, firstPage, users] = await Promise.all([
    getSession(),
    roomsApi.getSummary(),
    roomsApi.list(),
    usersApi.list(),
  ]);

  return (
    <>
      <Header breadcrumb={['Rooms']} user={session!} />
      <RoomsClient summary={summary} initialData={firstPage} users={users} />
    </>
  );
}
