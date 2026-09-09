'use client';

import { useRef, useState } from 'react';
import { Plus, DoorOpen } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { PageHeader } from '@/components/shared/page-header';
import { AnalyticCard } from '@/components/shared/analytic-card';
import { SearchInput } from '@/components/shared/search-input';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SortableTableHead,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { api } from '@/lib/axios';
import { toast } from '@/lib/toast-store';
import { formatNumber } from '@/lib/utils';
import { useTableSort } from '@/lib/use-table-sort';
import { getRoomsColumns } from '@/column/rooms';
import { roomsClientApi } from '@/feat/rooms/api.client';
import type {
  RoomListItemDTO,
  RoomListResponseDTO,
  RoomSummaryDTO,
  RoomDTO,
} from '@/feat/rooms/dto';
import type { UserSummaryDTO } from '@/feat/user/dto';
import { RoomFormModal } from './_partials/modal';
import { RoomCard } from './_partials/room-card';
import { Trash2 } from 'lucide-react';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { useRealtimeEvent } from '@/hooks/use-realtime-event';
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh';

interface RoomsClientProps {
  summary: RoomSummaryDTO;
  initialData: RoomListResponseDTO;
  users: UserSummaryDTO[];
}

const SEARCH_DEBOUNCE_MS = 250;

const ROOMS_SORT_ACCESSORS = {
  name: (r: RoomListItemDTO) => r.name,
  usage: (r: RoomListItemDTO) => r.totalUsage24hKwh,
};

function toApiDate(date: Date | undefined) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function RoomsClient({ summary, initialData, users }: RoomsClientProps) {
  const [data, setData] = useState<RoomListResponseDTO>(
    initialData ?? {
      data: [],
      page: 1,
      rowsPerPage: 10,
      totalRows: 0,
      totalPages: 1,
    }
  );
  const [page, setPage] = useState(initialData.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.rowsPerPage);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    room?: RoomDTO;
  }>({
    open: false,
  });
  const [deleteTarget, setDeleteTarget] = useState<RoomListItemDTO | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadRoomsRequestRef = useRef(0);

  const safeSummary: RoomSummaryDTO = {
    totalRooms: summary?.totalRooms ?? 0,
    totalGateways: {
      total: summary?.totalGateways?.total ?? 0,
      online: summary?.totalGateways?.online ?? 0,
      offline: summary?.totalGateways?.offline ?? 0,
    },
    totalDevices: {
      total: summary?.totalDevices?.total ?? 0,
      online: summary?.totalDevices?.online ?? 0,
      offline: summary?.totalDevices?.offline ?? 0,
    },
  };

  const loadRooms = async (
    nextPage = page,
    nextRowsPerPage = rowsPerPage,
    nextSearch = search,
    nextRange = dateRange
  ) => {
    const requestId = ++loadRoomsRequestRef.current;
    try {
      const res = await api.get<RoomListResponseDTO>('/rooms', {
        params: {
          page: nextPage,
          rowsPerPage: nextRowsPerPage,
          search: nextSearch || undefined,
          createdFrom: toApiDate(nextRange?.from),
          createdTo: toApiDate(nextRange?.to),
        },
      });
      // Ignore this response if a newer loadRooms call has since fired —
      // otherwise a slow, now-stale request (e.g. an old filter) can
      // resolve after a newer one and clobber the table with old data.
      if (requestId !== loadRoomsRequestRef.current) return;
      setData(res.data);
    } catch (err) {
      if (requestId !== loadRoomsRequestRef.current) return;
      toast.error(err instanceof Error ? err.message : 'Failed to load rooms');
    }
  };

  useRealtimeEvent<{ room: RoomDTO }>('room:created', () => {
    loadRooms(1, rowsPerPage, search);
    setPage(1);
  });
  useRealtimeEvent<{ room: RoomDTO }>('room:updated', ({ room }) => {
    setData((prev) => ({
      ...prev,
      data: prev.data.map((r) =>
        r.id === room.id
          ? {
              ...r,
              name: room.name,
              location: room.location,
              isCritical: room.isCritical,
            }
          : r
      ),
    }));
  });
  useRealtimeEvent<{ roomId: string }>('room:deleted', ({ roomId }) => {
    setData((prev) => ({
      ...prev,
      data: prev.data.filter((r) => r.id !== roomId),
    }));
  });
  useRealtimeRefresh(['device:status', 'room:power']);

  const openEdit = async (room: RoomListItemDTO) => {
    try {
      const detail = await roomsClientApi.getById(room.id);
      setModalState({ open: true, room: detail });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load room detail'
      );
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadRooms(1, rowsPerPage, value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleDateRangeApply = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
    loadRooms(1, rowsPerPage, search, range);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    loadRooms(nextPage, rowsPerPage, search);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
    loadRooms(1, nextRowsPerPage, search);
  };

  const handleTogglePower = async (room: RoomListItemDTO) => {
    const nextState = room.isPowerOn !== true;
    try {
      await roomsClientApi.setPower(room.id, nextState);
      setData((prev) => ({
        ...prev,
        data: prev.data.map((d) =>
          d.id === room.id ? { ...d, status: nextState ? 'on' : 'off' } : d
        ),
      }));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Could not change device power state'
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(roomsClientApi.remove(deleteTarget.id), {
        loading: `Deleting ${deleteTarget.name}...`,
        success: 'Room has been deleted',
      });
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((r) => r.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    const ids = Array.from(selected);
    setBulkDeleting(true);
    try {
      await toast.promise(
        Promise.all(ids.map((id) => roomsClientApi.remove(id))),
        {
          loading: `Deleting ${ids.length} room(s)...`,
          success: `${ids.length} room(s) have been deleted`,
        }
      );
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((r) => !selected.has(r.id)),
      }));
      setSelected(new Set());
      setBulkDeleteOpen(false);
    } catch {
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns = getRoomsColumns({
    isSelected: (id) => selected.has(id),

    onToggleSelect: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),

    onTogglePower: handleTogglePower,
    onView: (room) => (window.location.href = `/rooms/detail/${room.id}`),

    onEdit: openEdit,

    onDelete: (room) => setDeleteTarget(room),
  });

  const { sorted, sortKey, direction, toggleSort } = useTableSort(
    data.data,
    ROOMS_SORT_ACCESSORS
  );

  const allSelected =
    data.data.length > 0 && data.data.every((r) => selected.has(r.id));

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8 pb-24 md:pb-8">
      <PageHeader
        title="Rooms"
        description="Manage rooms and monitor connected electrical devices."
        actions={
          <Button
            onClick={() => setModalState({ open: true })}
            className="w-full md:w-[200px]"
          >
            <Plus className="size-4" /> Add room
          </Button>
        }
      />

      <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-3">
        <AnalyticCard
          title="Total room(s)"
          value={formatNumber(safeSummary.totalRooms)}
          unit="all locations"
        />
        <AnalyticCard
          title="Total gateway(s)"
          value={formatNumber(safeSummary.totalGateways.total)}
          breakdown={[
            {
              label: `${safeSummary.totalGateways.online} Online`,
              tone: 'success',
            },
            {
              label: `${safeSummary.totalGateways.offline} Offline`,
              tone: 'error',
            },
          ]}
        />
        <AnalyticCard
          title="Total device(s)"
          value={formatNumber(safeSummary.totalDevices.total)}
          breakdown={[
            {
              label: `${safeSummary.totalDevices.online} Online`,
              tone: 'success',
            },
            {
              label: `${safeSummary.totalDevices.offline} Offline`,
              tone: 'error',
            },
          ]}
        />
      </div>

      <TableToolbar
        summary={
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-emerald-500">
              {formatNumber(data.totalRows ?? 0)} room(s)
            </p>
          </div>
        }
        actions={
          <>
            <div className="min-w-0 flex-1 md:flex-none">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder="Search gateway..."
              />
            </div>

            <DateRangeFilter value={dateRange} onApply={handleDateRangeApply} />
          </>
        }
      >
        {selected.size > 0 && (
          <div className="flex w-full items-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete ({selected.size})
            </Button>
          </div>
        )}

        {data.data.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title={
              search || dateRange?.from ? 'No matching rooms' : 'No rooms yet'
            }
            description={
              search
                ? `No rooms match "${search}". Try a different search term.`
                : dateRange?.from
                  ? 'No rooms were created in this date range.'
                  : 'Create your first room to connect your gateway and device.'
            }
            action={
              !search &&
              !dateRange?.from && (
                <Button
                  onClick={() => setModalState({ open: true })}
                  className="w-[200px]"
                >
                  <Plus className="size-4" /> Add room
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* mobile */}
            <div className="flex w-full flex-col gap-3 md:hidden">
              {sorted.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onTogglePower={handleTogglePower}
                  onView={(r) =>
                    (window.location.href = `/rooms/detail/${r.id}`)
                  }
                  onEdit={openEdit}
                  onDelete={(r) => setDeleteTarget(r)}
                />
              ))}
            </div>
            <div className="hidden w-full md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() =>
                          setSelected(
                            allSelected
                              ? new Set()
                              : new Set(sorted.map((r) => r.id))
                          )
                        }
                      />
                    </TableHead>
                    <SortableTableHead
                      sortKey="name"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Room
                    </SortableTableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Device</TableHead>
                    <SortableTableHead
                      sortKey="usage"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Total usage(24H)
                    </SortableTableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((room) => (
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
            </div>

            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </>
        )}
      </TableToolbar>

      <RoomFormModal
        open={modalState.open}
        room={modalState.room}
        users={users}
        onOpenChange={(open) => setModalState({ open })}
        onSuccess={(saved) => {
          setData((prev) => ({
            ...prev,
            data: modalState.room
              ? prev.data.map((r) =>
                  r.id === saved.id
                    ? { ...r, name: saved.name, location: saved.location }
                    : r
                )
              : prev.data,
          }));
          setModalState({ open: false });
          toast.success(modalState.room ? 'Room updated' : 'Room created');
          if (!modalState.room) {
            setPage(1);
            loadRooms(1, rowsPerPage, search);
          }
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Room"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-bold">&quot;{deleteTarget?.name}&quot;</span>?
            This action cannot be undone.
          </>
        }
        confirming={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete Rooms"
        count={selected.size}
        itemLabel="room"
        confirming={bulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
