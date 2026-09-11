'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import type { DateRange } from 'react-day-picker';
import { ArrowLeft, DoorOpen, Plus, Trash2 } from 'lucide-react';
import { AnalyticCard } from '@/components/shared/analytic-card';
import { SearchInput } from '@/components/shared/search-input';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
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
import { formatDate, formatKwh } from '@/lib/utils';
import { toast } from '@/lib/toast-store';
import { getRoomDevicesColumns } from '@/column/room-devices';
import { roomsClientApi } from '@/feat/rooms/api.client';
import { devicesClientApi } from '@/feat/device/api.client';
import type {
  RoomDetailDTO,
  RoomDeviceDTO,
  RoomDeviceListResponseDTO,
  RoomDeviceLogEntryDTO,
  RoomDTO,
  RoomUsageSummaryDTO,
} from '@/feat/rooms/dto';
import type { DeviceStatusEventDTO } from '@/feat/device/dto';
import type { UserSummaryDTO } from '@/feat/user/dto';
import { DeviceLogModal } from './_partials/device-log-modal';
import { RoomFormModal } from '../../_partials/modal';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { EmptyState } from '@/components/shared/empty-state';
import { useRealtimeEvent } from '@/hooks/use-realtime-event';
import { useTableSort } from '@/lib/use-table-sort';

interface RoomDetailClientProps {
  room: RoomDetailDTO;
  devices: RoomDeviceListResponseDTO;
  users: UserSummaryDTO[];
}

interface LogModalState {
  open: boolean;
  device: RoomDeviceDTO | null;
  logs: RoomDeviceLogEntryDTO[] | null;
  loading: boolean;
}

const SEARCH_DEBOUNCE_MS = 250;
const USAGE_REFRESH_DEBOUNCE_MS = 3000;

function toApiDate(date: Date | undefined) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function RoomDetailClient({
  room,
  devices,
  users,
}: RoomDetailClientProps) {
  const [roomInfo, setRoomInfo] = useState(room);
  const [usage, setUsage] = useState<RoomUsageSummaryDTO>(room.usage);
  const [devicesData, setDevicesData] = useState(devices);
  const [page, setPage] = useState(devices.page);
  const [rowsPerPage, setRowsPerPage] = useState(devices.rowsPerPage);
  const [search, setSearch] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [logModal, setLogModal] = useState<LogModalState>({
    open: false,
    device: null,
    logs: null,
    loading: false,
  });
  const [modalState, setModalState] = useState<{
    open: boolean;
    room?: RoomDTO;
  }>({
    open: false,
  });
  const [deleteTarget, setDeleteTarget] = useState<RoomDeviceDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usageRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const loadDevicesRequestRef = useRef(0);

  const ROOM_DETAIL_SORT_ACCESSORS = {
    deviceEui: (d: RoomDeviceDTO) => d.deviceEui,
    deviceType: (d: RoomDeviceDTO) => d.deviceType,
    totalUsage24hKwh: (d: RoomDeviceDTO) => d.totalUsage24hKwh,
    intervalMinutes: (d: RoomDeviceDTO) => d.intervalMinutes,
    isPowerOn: (d: RoomDeviceDTO) => (d.isPowerOn ? 1 : 0),
  };

  const loadDevices = useCallback(
    async (
      nextPage: number,
      nextRowsPerPage: number,
      nextSearch: string,
      nextRange: DateRange | undefined
    ) => {
      const requestId = ++loadDevicesRequestRef.current;
      setIsFetching(true);
      try {
        const result = await roomsClientApi.listDevices(roomInfo.id, {
          page: nextPage,
          rowsPerPage: nextRowsPerPage,
          search: nextSearch || undefined,
          createdFrom: toApiDate(nextRange?.from),
          createdTo: toApiDate(nextRange?.to),
        });
        console.log(result);
        if (requestId !== loadDevicesRequestRef.current) return;
        setDevicesData(result);
      } catch (err) {
        if (requestId !== loadDevicesRequestRef.current) return;
        toast.error(
          err instanceof Error ? err.message : 'Failed to load devices'
        );
      } finally {
        if (requestId === loadDevicesRequestRef.current) setIsFetching(false);
      }
    },
    [roomInfo.id]
  );

  const refreshUsage = async () => {
    try {
      const result = await roomsClientApi.getUsageSummary(roomInfo.id);
      setUsage(result);
    } catch {}
  };

  useRealtimeEvent<DeviceStatusEventDTO>('device:status', (payload) => {
    if (payload.roomId !== roomInfo.id) return;
    if (usageRefreshTimeoutRef.current) {
      clearTimeout(usageRefreshTimeoutRef.current);
    }
    usageRefreshTimeoutRef.current = setTimeout(
      refreshUsage,
      USAGE_REFRESH_DEBOUNCE_MS
    );
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadDevices(1, rowsPerPage, value, dateRange);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleDateRangeApply = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
    loadDevices(1, rowsPerPage, search, range);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    loadDevices(nextPage, rowsPerPage, search, dateRange);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
    loadDevices(1, nextRowsPerPage, search, dateRange);
  };

  const deviceRows = devicesData.data;
  const online = deviceRows.filter((device) => device.isPowerOn).length;

  const handleTogglePower = async (device: RoomDeviceDTO) => {
    const nextState = !device.isPowerOn;

    setDevicesData((prev) => ({
      ...prev,
      data: prev.data.map((d) =>
        d.id === device.id ? { ...d, isPowerOn: nextState } : d
      ),
    }));

    try {
      await devicesClientApi.setPower(device.id, nextState);
    } catch (err) {
      setDevicesData((prev) => ({
        ...prev,
        data: prev.data.map((d) =>
          d.id === device.id ? { ...d, isPowerOn: device.isPowerOn } : d
        ),
      }));
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
      await toast.promise(devicesClientApi.remove(deleteTarget.id), {
        loading: `Removing ${deleteTarget.tbDeviceId}...`,
        success: 'Device has been removed from this room',
      });
      setDevicesData((prev) => ({
        ...prev,
        data: prev.data.filter((d) => d.id !== deleteTarget.id),
        totalRows: Math.max(0, prev.totalRows - 1),
      }));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
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
      const results = await Promise.allSettled(
        ids.map((id) => devicesClientApi.remove(id))
      );
      const successfulIds = ids.filter(
        (_, index) => results[index].status === 'fulfilled'
      );
      const failedCount = results.length - successfulIds.length;

      setDevicesData((prev) => ({
        ...prev,
        data: prev.data.filter((d) => !successfulIds.includes(d.id)),
        totalRows: Math.max(0, prev.totalRows - successfulIds.length),
      }));
      setSelected(new Set());
      setBulkDeleteOpen(false);

      if (failedCount === 0) {
        toast.success(`${successfulIds.length} device(s) removed`);
      } else {
        toast.error(`${successfulIds.length} removed, ${failedCount} failed`);
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  const openDeviceLog = async (device: RoomDeviceDTO) => {
    setLogModal({ open: true, device, logs: null, loading: true });
    try {
      const logs = await roomsClientApi.getDeviceLog(roomInfo.id, device.id);
      setLogModal({ open: true, device, logs, loading: false });
    } catch (err) {
      setLogModal({ open: true, device, logs: [], loading: false });
      toast.error(
        err instanceof Error ? err.message : 'Failed to load device log'
      );
    }
  };

  const closeDeviceLog = () => {
    setLogModal((prev) => ({
      ...prev,
      open: false,
    }));
  };

  const columns = getRoomDevicesColumns({
    isSelected: (id) => selected.has(id),
    onToggleSelect: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    onTogglePower: handleTogglePower,
    onViewLog: openDeviceLog,
    onDelete: (device) => setDeleteTarget(device),
    onIntervalChange: (device, minutes) => {
      if (minutes < 15) return;
      setDevicesData((prev) => ({
        ...prev,
        data: prev.data.map((d) =>
          d.id === device.id ? { ...d, intervalMinutes: minutes } : d
        ),
      }));
    },
  });

  const { sorted, sortKey, direction, toggleSort } = useTableSort(
    deviceRows,
    ROOM_DETAIL_SORT_ACCESSORS
  );

  const allSelected =
    sorted.length > 0 && sorted.every((r) => selected.has(r.id));

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <div className="flex w-full items-start gap-1">
        <Link
          href="/rooms"
          aria-label="Back to rooms"
          className="mt-1 flex size-8 items-center justify-center rounded-md border border-slate-400 bg-white"
        >
          <ArrowLeft className="size-4 text-slate-950" />
        </Link>

        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-[36px] font-bold leading-[44px] tracking-[-0.72px] text-emerald-500">
              {roomInfo.name}
            </h1>
          </div>
          <div className="flex flex-col gap-1 text-xs text-slate-600 md:flex-row md:items-center md:gap-4">
            <span>
              Created at:{' '}
              <span className="text-slate-950">{roomInfo.location}</span>
            </span>
            <span>
              Created at:{' '}
              <span className="text-slate-950">
                {formatDate(roomInfo.createdAt)}
              </span>
            </span>
            <span>
              Last updated:{' '}
              <span className="text-slate-950">
                {roomInfo.lastUpdatedAt
                  ? formatDate(roomInfo.lastUpdatedAt)
                  : '-'}
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-600">{roomInfo.description}</p>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-3">
        <AnalyticCard
          title="Total usage(24H)"
          value={formatKwh(usage.total24hKwh ?? 0, 0).replace(' kWh', '')}
          unit="kWh"
        />
        <AnalyticCard
          title="Avg usage(24H)"
          value={formatKwh(usage.avg24hKwh ?? 0, 0).replace(' kWh', '')}
          unit="kWh"
        />
        <AnalyticCard
          title="Peak usage"
          value={formatKwh(usage.peakKwh ?? 0, 0).replace(' kWh', '')}
          unit="kWh"
          tone="red"
        />
        <AnalyticCard
          title="Highest component"
          value={formatKwh(usage.highestComponent.kwh, 0).replace(' kWh', '')}
          unit={usage.highestComponent.name}
          tone="red"
        />
      </div>

      <TableToolbar
        summary={
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-emerald-500">
              {devicesData.totalRows} device(s)
            </p>

            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                {online} Online
              </span>

              <span className="flex items-center gap-1.5 text-red-500">
                <span className="size-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                {deviceRows.length - online} Offline
              </span>
            </div>
          </div>
        }
        actions={
          <>
            <div className="min-w-0 flex-1 md:flex-none">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder="Search device EUI ..."
                className="flex-1 md:flex-none"
              />
            </div>

            <DateRangeFilter value={dateRange} onApply={handleDateRangeApply} />
          </>
        }
      >
        {selected.size > 0 && (
          <div className="flex w-full items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Remove ({selected.size})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Clear selection
            </Button>
          </div>
        )}

        <motion.div
          key={isFetching ? 'loading' : 'loaded'}
          initial={{ opacity: 0 }}
          animate={{ opacity: isFetching ? 0.4 : 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex w-full flex-col items-end gap-4"
        >
          {sorted.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title={search ? 'No matching devices' : 'No devices yet'}
              description={
                search
                  ? `No devices match "${search}". Try a different search term.`
                  : 'Add devices to this room from the Device page.'
              }
              action={
                !search && (
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
                              : new Set(sorted.map((device) => device.id))
                          )
                        }
                      />
                    </TableHead>

                    <SortableTableHead
                      sortKey="deviceEui"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Device
                    </SortableTableHead>

                    <SortableTableHead
                      sortKey="deviceType"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Component
                    </SortableTableHead>

                    <SortableTableHead
                      sortKey="usage"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Total usage(24H)
                    </SortableTableHead>

                    <SortableTableHead
                      sortKey="intervalMinutes"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Interval
                    </SortableTableHead>

                    <SortableTableHead
                      sortKey="isPowerOn"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Status
                    </SortableTableHead>

                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sorted.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>{columns.checkbox(device)}</TableCell>

                      <TableCell>{columns.device(device)}</TableCell>

                      <TableCell>{columns.component(device)}</TableCell>

                      <TableCell>{columns.usage(device)}</TableCell>

                      <TableCell>{columns.interval(device)}</TableCell>

                      <TableCell>{columns.status(device)}</TableCell>

                      <TableCell>{columns.action(device)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                page={page}
                totalPages={devicesData.totalPages}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </>
          )}
        </motion.div>
      </TableToolbar>

      <DeviceLogModal
        device={logModal.device}
        logs={logModal.logs}
        loading={logModal.loading}
        open={logModal.open}
        onClose={closeDeviceLog}
      />

      <RoomFormModal
        open={modalState.open}
        room={modalState.room}
        users={users}
        onOpenChange={(open) => setModalState({ open })}
        onSuccess={(saved) => {
          setRoomInfo((prev) => ({
            ...prev,
            name: saved.name,
            location: saved.location,
            picName: saved.picName,
            picPhone: saved.picPhone,
            description: saved.description,
            isCritical: saved.isCritical,
          }));
          setModalState({ open: false });
          toast.success(modalState.room ? 'Room updated' : 'Room created');
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Device"
        description={
          <>
            Are you sure you want to remove{' '}
            <span className="font-bold">
              &quot;{deleteTarget?.tbDeviceId}&quot;
            </span>{' '}
            from this room? This action cannot be undone.
          </>
        }
        confirming={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Remove Devices"
        count={selected.size}
        itemLabel="device"
        confirming={bulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
