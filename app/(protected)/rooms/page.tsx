import { getSession } from "@/lib/auth";
import { Header } from "@/components/shared/header";
import { roomsApi } from "@/feat/rooms/api";
import { RoomsClient } from "./client";

export default async function RoomsPage() {
  const [session, summary, firstPage] = await Promise.all([
    getSession(),
    roomsApi.getSummary(),
    roomsApi.list({ page: 1, rowsPerPage: 10 }),
  ]);

  return (
    <>
      <Header breadcrumb={["Rooms"]} user={session!} />
      <RoomsClient summary={summary} initialData={firstPage} />
    </>
  );
}
