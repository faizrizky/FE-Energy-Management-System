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
  params: Promise<{ roomId: string }>;
}) {
  // Next 15: params sekarang Promise, jadi harus di-await dulu.
  const { roomId } = await params;
  const [session, room, devices, users] = await Promise.all([
    getSession(),
    roomsApi.getById(roomId),
    roomsApi.listDevices(roomId, { page: 1, rowsPerPage: 10 }),
    usersApi.listSummary(),
  ]);

  return (
    <>
      <Header breadcrumb={['Rooms', room.name]} user={session!} />
      <RoomDetailClient room={room} devices={devices} users={users} />
    </>
  );
}
