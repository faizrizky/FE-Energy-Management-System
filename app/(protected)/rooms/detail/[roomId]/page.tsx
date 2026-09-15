import { getSession } from '@/lib/auth';
import { Header } from '@/components/shared/header';
import { roomsApi } from '@/feat/rooms/api';
import { usersApi } from '@/feat/user/api';
import { RoomDetailClient } from './client';

/**
 * Server component halaman detail room: ambil session, detail room, halaman
 * pertama device-nya, sama user buat form edit.
 *
 * Dipake di: Otomatis sama Next.js buat route /rooms/detail/[roomId].
 */
export default async function RoomDetailPage({
  params,
}: {
  params: { roomId: string };
}) {
  const [session, room, devices, users] = await Promise.all([
    getSession(),
    roomsApi.getById(params.roomId),
    roomsApi.listDevices(params.roomId, { page: 1, rowsPerPage: 10 }),
    usersApi.listSummary(),
  ]);

  return (
    <>
      <Header breadcrumb={['Rooms', room.name]} user={session!} />
      <RoomDetailClient room={room} devices={devices} users={users} />
    </>
  );
}
