'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Smartphone, Trash2 } from 'lucide-react';
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
import { toast } from '@/lib/toast-store';
import { formatNumber } from '@/lib/utils';
import { useTableSort } from '@/lib/use-table-sort';
import { getDeviceColumns } from '@/column/device';
import { devicesClientApi } from '@/feat/device/api.client';
import type {
  DeviceDetailDTO,
  DeviceDTO,
  DeviceListResponseDTO,
} from '@/feat/device/dto';
import type { RoomListItemDTO } from '@/feat/rooms/dto';
import type { GatewayDTO } from '@/feat/gateway/dto';
import { DeviceFormModal } from './_partials/modal';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { useRealtimeEvent } from '@/hooks/use-realtime-event';
import type { DeviceStatusEventDTO } from '@/feat/device/dto';
import { DeviceDetailModal } from './_partials/detail-modal';
import { connectSocket } from '@/lib/socket';

interface DeviceClientProps {
  initialData: DeviceListResponseDTO;
  rooms: RoomListItemDTO[];
  gateways: GatewayDTO[];
}
const SEARCH_DEBOUNCE_MS = 250;

const DEVICE_SORT_ACCESSORS = {
  name: (d: DeviceDTO) => d.name,
  component: (d: DeviceDTO) => d.deviceType,
  room: (d: DeviceDTO) => d.room?.name ?? '',
  gateway: (d: DeviceDTO) => d.gateway?.name ?? '',
  tbDeviceId: (d: DeviceDTO) => d.tbDeviceId,
  inverval: (d: DeviceDTO) => d.intervalMinutes,
  status: (d: DeviceDTO) => d.status,
};

function toApiDate(date: Date | undefined) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function DeviceClient({
  initialData,
  rooms,
  gateways,
}: DeviceClientProps) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(initialData.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.rowsPerPage);
  const [search, setSearch] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    device?: DeviceDTO;
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<DeviceDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDevice, setDetailDevice] = useState<DeviceDetailDTO | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadDevicesRequestRef = useRef(0);
  const online = data.data.filter((d) => d.status === 'on').length;

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
        const result = await devicesClientApi.list({
          page: nextPage,
          rowsPerPage: nextRowsPerPage,
          search: nextSearch,
          createdFrom: toApiDate(nextRange?.from),
          createdTo: toApiDate(nextRange?.to),
        });
        if (requestId !== loadDevicesRequestRef.current) return;
        setData(result);
      } catch (err) {
        if (requestId !== loadDevicesRequestRef.current) return;
        toast.error(
          err instanceof Error ? err.message : 'Failed to load devices'
        );
      } finally {
        if (requestId === loadDevicesRequestRef.current) setIsFetching(false);
      }
    },
    []
  );

  useEffect(() => {
    const socket = connectSocket();
    let timeout: ReturnType<typeof setTimeout>;

    const scheduleRefresh = () => {
      clearTimeout(timeout);
      timeout = setTimeout(
        () => loadDevices(page, rowsPerPage, search, dateRange),
        3000
      );
    };

    socket.on('device:status', scheduleRefresh);
    return () => {
      socket.off('device:status', scheduleRefresh);
      clearTimeout(timeout);
    };
  }, [page, rowsPerPage, search, dateRange, loadDevices]);

  useRealtimeEvent<{ device: DeviceDTO }>('device:created', ({ device }) => {
    setData((prev) =>
      prev.data.some((d) => d.id === device.id)
        ? prev
        : {
            ...prev,
            data: [device, ...prev.data],
            totalRows: prev.totalRows + 1,
          }
    );
  });

  useRealtimeEvent<{ device: DeviceDTO }>('device:updated', ({ device }) => {
    setData((prev) => ({
      ...prev,
      data: prev.data.map((d) =>
        d.id === device.id ? { ...d, ...device } : d
      ),
    }));
  });

  useRealtimeEvent<{ deviceId: string }>('device:deleted', ({ deviceId }) => {
    setData((prev) => ({
      ...prev,
      data: prev.data.filter((d) => d.id !== deviceId),
      totalRows: Math.max(0, prev.totalRows - 1),
    }));
  });

  useRealtimeEvent<DeviceStatusEventDTO>('device:status', (payload) => {
    setData((prev) => ({
      ...prev,
      data: prev.data.map((d) =>
        d.id === payload.deviceId
          ? { ...d, status: payload.status, lastSeenAt: payload.timestamp }
          : d
      ),
    }));
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

  const handleTogglePower = async (device: DeviceDTO) => {
    const nextState = device.status !== 'on';
    try {
      await devicesClientApi.setPower(device.id, nextState);
      setData((prev) => ({
        ...prev,
        data: prev.data.map((d) =>
          d.id === device.id ? { ...d, status: nextState ? 'on' : 'off' } : d
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
      await toast.promise(devicesClientApi.remove(deleteTarget.id), {
        loading: `Deleting ${deleteTarget.name}...`,
        success: 'Device has been deleted',
      });
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((d) => d.id !== deleteTarget.id),
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
      const results = await Promise.allSettled(
        ids.map((id) => devicesClientApi.remove(id))
      );
      const successfulIds = ids.filter(
        (_, index) => results[index].status === 'fulfilled'
      );
      const failedCount = results.length - successfulIds.length;

      setData((prev) => ({
        ...prev,
        data: prev.data.filter((d) => !successfulIds.includes(d.id)),
      }));
      setSelected(new Set());
      setBulkDeleteOpen(false);

      if (failedCount === 0) {
        toast.success(`${successfulIds.length} device(s) deleted`);
      } else {
        toast.error(`${successfulIds.length} deleted, ${failedCount} failed`);
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  const openDeviceDetail = async (device: DeviceDTO) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailDevice(null);

    try {
      const result = await devicesClientApi.getById(device.id);
      setDetailDevice(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load device detail'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDeviceDetail = () => {
    setDetailOpen(false);
  };

  const columns = getDeviceColumns({
    isSelected: (id) => selected.has(id),
    onToggleSelect: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    onView: openDeviceDetail,
    onTogglePower: handleTogglePower,
    onEdit: (device) => setModalState({ open: true, device }),
    onDelete: (device) => setDeleteTarget(device),
  });

  const { sorted, sortKey, direction, toggleSort } = useTableSort(
    data.data,
    DEVICE_SORT_ACCESSORS
  );

  const allSelected =
    sorted.length > 0 && sorted.every((d) => selected.has(d.id));

  return (
    <>
      <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
        <PageHeader
          title="Devices"
          description="Manage electrical devices connected to rooms and gateways."
          actions={
            <Button
              onClick={() => setModalState({ open: true })}
              className="w-full md:w-[200px]"
            >
              <Plus className="size-4" /> Add device
            </Button>
          }
        />

        <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-3">
          <AnalyticCard
            title="Total device(s)"
            value={formatNumber(data.totalRows)}
            unit="all rooms"
          />
          <AnalyticCard
            title="On"
            value={formatNumber(online)}
            unit="device(s)"
          />
          <AnalyticCard
            title="Off"
            value={formatNumber(data.data.length - online)}
            unit="device(s)"
            tone="red"
          />
        </div>

        <TableToolbar
          summary={
            <p className="text-lg font-semibold text-emerald-500">
              {formatNumber(data.data.length)} device(s)
            </p>
          }
          actions={
            <>
              <div className="min-w-0 flex-1 md:flex-none">
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  className="flex-1 md:flex-none"
                />
              </div>

              <DateRangeFilter
                value={dateRange}
                onApply={handleDateRangeApply}
              />
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

          <motion.div
            key={isFetching ? 'loading' : 'loaded'}
            initial={{ opacity: 0 }}
            animate={{ opacity: isFetching ? 0.4 : 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex w-full flex-col items-end gap-4"
          >
            {data.data.length === 0 ? (
              <EmptyState
                icon={Smartphone}
                title={
                  search || dateRange?.from
                    ? 'No matching devices'
                    : 'No devices yet'
                }
                description={
                  search
                    ? `No devices match "${search}". Try a different search term.`
                    : dateRange?.from
                      ? 'No devices were created in this date range.'
                      : 'Add your first device and connect it to a room and gateway.'
                }
                action={
                  !search &&
                  !dateRange?.from && (
                    <Button
                      onClick={() => setModalState({ open: true })}
                      className="w-[200px]"
                    >
                      <Plus className="size-4" /> Add device
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
                                : new Set(sorted.map((d) => d.id))
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
                        Role
                      </SortableTableHead>

                      <SortableTableHead
                        sortKey="component"
                        activeKey={sortKey}
                        direction={direction}
                        onSort={toggleSort}
                      >
                        Component
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="room"
                        activeKey={sortKey}
                        direction={direction}
                        onSort={toggleSort}
                      >
                        Room
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="gateway"
                        activeKey={sortKey}
                        direction={direction}
                        onSort={toggleSort}
                      >
                        Gateway
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="tbDeviceId"
                        activeKey={sortKey}
                        direction={direction}
                        onSort={toggleSort}
                      >
                        ThingsBoard ID
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="inverval"
                        activeKey={sortKey}
                        direction={direction}
                        onSort={toggleSort}
                      >
                        Interval
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
                        <TableCell>{columns.room(device)}</TableCell>
                        <TableCell>{columns.gateway(device)}</TableCell>
                        <TableCell>{columns.tbDeviceId(device)}</TableCell>
                        <TableCell>{columns.interval(device)}</TableCell>
                        <TableCell>{columns.action(device)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Pagination
                  page={page}
                  totalPages={data.totalPages}
                  onPageChange={handlePageChange}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleRowsPerPageChange}
                />
              </>
            )}
          </motion.div>
        </TableToolbar>

        <DeviceFormModal
          open={modalState.open}
          device={modalState.device}
          rooms={rooms}
          gateways={gateways}
          onOpenChange={(open) => setModalState({ open })}
          onSuccess={(saved) => {
            const room = rooms.find((r) => r.id === saved.roomId);
            const gateway = gateways.find((g) => g.id === saved.gatewayId);
            const enriched: DeviceDTO = {
              ...saved,
              room: room
                ? { id: room.id, name: room.name, location: room.location }
                : (saved.room ?? null),
              gateway: gateway
                ? { id: gateway.id, eui: gateway.eui, name: gateway.name }
                : (saved.gateway ?? null),
            };

            setData((prev) => {
              const exists = prev.data.some((d) => d.id === enriched.id);

              if (exists) {
                return {
                  ...prev,
                  data: prev.data.map((d) =>
                    d.id === enriched.id ? enriched : d
                  ),
                };
              }

              return {
                ...prev,
                data: [enriched, ...prev.data],
              };
            });

            const wasEditing = !!modalState.device;
            setModalState({ open: false });
            toast.success(wasEditing ? 'Device updated' : 'Device created');

            if (!wasEditing) {
              setPage(1);
              loadDevices(1, rowsPerPage, search, dateRange);
            }
          }}
        />

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Device"
          description={
            <>
              Are you sure you want to delete{' '}
              <span className="font-bold">
                &quot;{deleteTarget?.name}&quot;
              </span>
              ? This action cannot be undone.
            </>
          }
          confirming={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />

        <ConfirmDialog
          open={bulkDeleteOpen}
          title="Delete Devices"
          count={selected.size}
          itemLabel="device"
          confirming={bulkDeleting}
          onConfirm={handleConfirmBulkDelete}
          onCancel={() => setBulkDeleteOpen(false)}
        />
      </div>
      <DeviceDetailModal
        open={detailOpen}
        device={detailDevice}
        loading={detailLoading}
        onOpenChange={setDetailOpen}
        onClose={closeDeviceDetail}
      />
    </>
  );
}
