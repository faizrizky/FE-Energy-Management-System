import { getSession } from "@/lib/auth";
import { Header } from "@/components/shared/header";
import { roomsApi } from "@/feat/rooms/api";
import { RoomDetailClient } from "./client";

export default async function RoomDetailPage({ params }: { params: { roomId: string } }) {
  const [session, room, devices] = await Promise.all([
    getSession(),
    roomsApi.getById(params.roomId),
    roomsApi.getDevices(params.roomId),
  ]);

  return (
    <>
      <Header breadcrumb={["Rooms", room.name]} user={session!} />
      <RoomDetailClient room={room} initialDevices={devices} />
    </>
  );
}
