"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, ListFilter, DoorOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticCard } from "@/components/shared/analytic-card";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { api } from "@/lib/axios";
import { toast } from "@/lib/toast-store";
import { formatNumber } from "@/lib/utils";
import { getRoomsColumns } from "@/column/rooms";
import { roomsApi } from "@/feat/rooms/api";
import type { RoomListItemDTO, RoomListResponseDTO, RoomSummaryDTO } from "@/feat/rooms/dto";
import { RoomFormModal } from "./_partials/modal";

interface RoomsClientProps {
  summary: RoomSummaryDTO;
  initialData: RoomListResponseDTO;
}

export function RoomsClient({ summary, initialData }: RoomsClientProps) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(initialData.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.rowsPerPage);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{ open: boolean; room?: RoomListItemDTO }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<RoomListItemDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      api
        .get<RoomListResponseDTO>("/rooms", { params: { page, rowsPerPage, search: search || undefined } })
        .then((res) => setData(res.data))
        .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load rooms"));
    }, 250);
    return () => clearTimeout(timeout);
  }, [page, rowsPerPage, search]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(roomsApi.remove(deleteTarget.id), {
        loading: `Deleting ${deleteTarget.name}...`,
        success: "Room has been deleted",
      });
      setData((prev) => ({ ...prev, data: prev.data.filter((r) => r.id !== deleteTarget.id) }));
      setDeleteTarget(null);
    } catch {
      // toast.promise sudah menampilkan toast.error; biarkan modal tetap terbuka
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () =>
      getRoomsColumns({
        isSelected: (id) => selected.has(id),
        onToggleSelect: (id) =>
          setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          }),
        onTogglePower: async (room) => {
          try {
            await roomsApi.setPower(room.id, !room.isPowerOn);
            setData((prev) => ({
              ...prev,
              data: prev.data.map((r) => (r.id === room.id ? { ...r, isPowerOn: !r.isPowerOn } : r)),
            }));
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not change room power state");
          }
        },
        onView: (room) => (window.location.href = `/rooms/detail/${room.id}`),
        onEdit: (room) => setModalState({ open: true, room }),
        onDelete: (room) => setDeleteTarget(room),
      }),
    [selected]
  );

  const allSelected = data.data.length > 0 && data.data.every((r) => selected.has(r.id));

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Rooms"
        description="Manage rooms and monitor connected electrical devices."
        actions={
          <Button onClick={() => setModalState({ open: true })} className="w-[200px]">
            <Plus className="size-4" /> Add room
          </Button>
        }
      />

      <div className="flex w-full items-stretch gap-2.5">
        <AnalyticCard title="Total room(s)" value={formatNumber(summary.totalRooms)} unit="all locations" />
        <AnalyticCard
          title="Total gateway(s)"
          value={formatNumber(summary.totalGateways.total)}
          breakdown={[
            { label: `${summary.totalGateways.online} Online`, tone: "success" },
            { label: `${summary.totalGateways.offline} Offline`, tone: "error" },
          ]}
        />
        <AnalyticCard
          title="Total device(s)"
          value={formatNumber(summary.totalDevices.total)}
          breakdown={[
            { label: `${summary.totalDevices.online} Online`, tone: "success" },
            { label: `${summary.totalDevices.offline} Offline`, tone: "error" },
          ]}
        />
      </div>

      <div className="flex w-full flex-col items-end gap-4 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-semibold text-emerald-500">{formatNumber(data.totalRows)} room(s)</p>
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Ruang 101" />
            <Button variant="outline" size="sm" className="w-[150px] justify-between">
              <ListFilter className="size-4" /> Filter by role
            </Button>
          </div>
        </div>

        {data.data.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title={search ? "No matching rooms" : "No rooms yet"}
            description={
              search
                ? `No rooms match "${search}". Try a different search term.`
                : "Create your first room to connect your gateway and device."
            }
            action={
              !search && (
                <Button onClick={() => setModalState({ open: true })} className="w-[200px]">
                  <Plus className="size-4" /> Add room
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() =>
                        setSelected(allSelected ? new Set() : new Set(data.data.map((r) => r.id)))
                      }
                    />
                  </TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Total usage(24H)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>{columns.checkbox(room)}</TableCell>
                    <TableCell>{columns.room(room)}</TableCell>
                    <TableCell>{columns.gateway(room)}</TableCell>
                    <TableCell>{columns.device(room)}</TableCell>
                    <TableCell>{columns.usage(room)}</TableCell>
                    <TableCell>{columns.status(room)}</TableCell>
                    <TableCell>{columns.action(room)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={setRowsPerPage}
            />
          </>
        )}
      </div>

      <RoomFormModal
        open={modalState.open}
        room={modalState.room}
        onOpenChange={(open) => setModalState({ open })}
        onSuccess={(saved) => {
          setData((prev) => ({
            ...prev,
            data: modalState.room
              ? prev.data.map((r) => (r.id === saved.id ? { ...r, name: saved.name, location: saved.location } : r))
              : prev.data,
          }));
          setModalState({ open: false });
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Room"
        description={
          <>
            Are you sure you want to delete <span className="font-bold">&quot;{deleteTarget?.name}&quot;</span>? This
            action cannot be undone.
          </>
        }
        confirming={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}