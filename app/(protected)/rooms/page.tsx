import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { roomsApi } from '@/feat/rooms/api';
import { usersApi } from '@/feat/user/api';
import { RoomsClient } from './client';

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ createdFrom?: string; createdTo?: string }>;
}) {
  const params = await searchParams;

  const [session, summary, firstPage, users] = await Promise.all([
    getSession(),
    roomsApi.getSummary(),
    roomsApi.list({
      page: 1,
      rowsPerPage: 10,
      createdFrom: params.createdFrom,
      createdTo: params.createdTo,
    }),
    usersApi.listSummary(),
  ]);

  return (
    <>
      <Header breadcrumb={['Rooms']} user={session!} />
      <RoomsClient summary={summary} initialData={firstPage} users={users} />
    </>
  );
}
