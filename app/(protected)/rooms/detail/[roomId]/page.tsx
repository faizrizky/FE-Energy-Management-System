import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { roomsApi } from '@/feat/rooms/api';
import { RoomDetailClient } from './client';

export default async function RoomDetailPage({
  params,
}: {
  params: { roomId: string };
}) {
  const [session, room] = await Promise.all([
    getSession(),
    roomsApi.getById(params.roomId, { page: 1, rowsPerPage: 10 }),
  ]);

  return (
    <>
      <Header breadcrumb={['Rooms', room.name]} user={session!} />
      <RoomDetailClient room={room} />
    </>
  );
}
