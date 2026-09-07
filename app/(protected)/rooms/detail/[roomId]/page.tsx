// app/(protected)/rooms/detail/[roomId]/page.tsx
import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { roomsApi } from '@/feat/rooms/api';
import { usersApi } from '@/feat/user/api';
import { RoomDetailClient } from './client';

export default async function RoomDetailPage({
  params,
}: {
  params: { roomId: string };
}) {
  const [session, room, users] = await Promise.all([
    getSession(),
    roomsApi.getById(params.roomId, { page: 1, rowsPerPage: 10 }),
    usersApi.listSummary(),
  ]);

  return (
    <>
      <Header breadcrumb={['Rooms', room.name]} user={session!} />
      <RoomDetailClient room={room} users={users} />
    </>
  );
}
