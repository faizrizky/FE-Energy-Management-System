'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Smartphone } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { AnalyticCard } from '@/components/shared/analytic-card';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, formatKwh } from '@/lib/utils';
import { toast } from '@/lib/toast-store';
import { getRoomDevicesColumns } from '@/column/room-devices';
import { roomsClientApi } from '@/feat/rooms/api.client';
import type {
  RoomDetailDTO,
  RoomDeviceDTO,
  RoomDeviceLogEntryDTO,
} from '@/feat/rooms/dto';
import { DeviceLogModal } from './_partials/device-log-modal';

interface RoomDetailClientProps {
  room: RoomDetailDTO;
}

interface LogModalState {
  open: boolean;
  device: RoomDeviceDTO | null;
  logs: RoomDeviceLogEntryDTO[] | null;
  loading: boolean;
}

const SEARCH_DEBOUNCE_MS = 250;

export function RoomDetailClient({ room }: RoomDetailClientProps) {
  const [roomInfo] = useState(room);
  const [devicesData, setDevicesData] = useState(room.devices);
  const [page, setPage] = useState(room.devices.page);
  const [rowsPerPage, setRowsPerPage] = useState(room.devices.rowsPerPage);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [logModal, setLogModal] = useState<LogModalState>({
    open: false,
    device: null,
    logs: null,
    loading: false,
  });

  const [deleteTarget, setDeleteTarget] = useState<RoomDeviceDTO | null>(null);

  const [deleting, setDeleting] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDevices = async (
    nextPage = page,
    nextRowsPerPage = rowsPerPage,
    nextSearch = search
  ) => {
    try {
      const result = await roomsClientApi.getById(roomInfo.id, {
        page: nextPage,
        rowsPerPage: nextRowsPerPage,
        search: nextSearch || undefined,
      });

      setDevicesData(result.devices);
      setSelected(new Set());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load devices'
      );
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadDevices(1, rowsPerPage, value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    loadDevices(nextPage, rowsPerPage, search);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);

    loadDevices(1, nextRowsPerPage, search);
  };

  const devices = devicesData.data;

  const online = devices.filter((device) => device.isPowerOn).length;

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    setDeleting(true);

    setDevicesData((prev) => ({
      ...prev,
      data: prev.data.filter((device) => device.id !== deleteTarget.id),
      totalRows: Math.max(0, prev.totalRows - 1),
    }));

    toast.success('Device has been removed from this room');

    setDeleteTarget(null);
    setDeleting(false);
  };

  const openDeviceLog = async (device: RoomDeviceDTO) => {
    setLogModal({
      open: true,
      device,
      logs: null,
      loading: true,
    });

    try {
      const logs = await roomsClientApi.getDeviceLog(roomInfo.id, device.id);

      setLogModal({
        open: true,
        device,
        logs,
        loading: false,
      });
    } catch (err) {
      setLogModal({
        open: true,
        device,
        logs: [],
        loading: false,
      });

      toast.error(
        err instanceof Error ? err.message : 'Failed to load device log'
      );
    }
  };

  const closeDeviceLog = () => {
    setLogModal({
      open: false,
      device: null,
      logs: null,
      loading: false,
    });
  };

  const columns = useMemo(
    () =>
      getRoomDevicesColumns({
        isSelected: (id) => selected.has(id),

        onToggleSelect: (id) =>
          setSelected((prev) => {
            const next = new Set(prev);

            next.has(id) ? next.delete(id) : next.add(id);

            return next;
          }),

        onTogglePower: (device) =>
          setDevicesData((prev) => ({
            ...prev,
            data: prev.data.map((item) =>
              item.id === device.id
                ? {
                    ...item,
                    isPowerOn: !item.isPowerOn,
                  }
                : item
            ),
          })),

        onViewLog: openDeviceLog,

        onDelete: (device) => setDeleteTarget(device),

        onIntervalChange: (device, minutes) => {
          if (minutes < 15) return;

          setDevicesData((prev) => ({
            ...prev,
            data: prev.data.map((item) =>
              item.id === device.id
                ? {
                    ...item,
                    intervalMinutes: minutes,
                  }
                : item
            ),
          }));
        },
      }),
    [selected]
  );

  const allSelected =
    devices.length > 0 && devices.every((device) => selected.has(device.id));

  const hasNoResults = devices.length === 0;

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title={roomInfo.name}
        // description={roomInfo.description}
        actions={
          <Link
            href="/rooms"
            aria-label="Back to rooms"
            className="mt-1 flex size-8 items-center justify-center rounded-md border border-slate-400 bg-white"
          >
            <ArrowLeft className="size-4 text-slate-950" />
          </Link>
        }
      />

      <div className="flex w-full items-start gap-1">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="font-display text-[36px] font-bold leading-[44px] tracking-[-0.72px] text-emerald-500">
            {roomInfo.name}
          </h1>

          <div className="flex flex-col gap-1 text-xs text-slate-600 md:flex-row md:items-center md:gap-4">
            <span>
              Location:{' '}
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
          value={formatKwh(roomInfo.usage.total24hKwh ?? 0, 0).replace(
            ' kWh',
            ''
          )}
          unit="kWh"
        />

        <AnalyticCard
          title="Avg usage(24H)"
          value={formatKwh(roomInfo.usage.avg24hKwh ?? 0, 0).replace(
            ' kWh',
            ''
          )}
          unit="kWh"
        />

        <AnalyticCard
          title="Peak usage"
          value={formatKwh(roomInfo.usage.peakKwh ?? 0, 0).replace(' kWh', '')}
          unit="kWh"
          tone="red"
        />

        <AnalyticCard
          title="Highest component"
          value={formatKwh(roomInfo.usage.highestComponent.kwh, 0).replace(
            ' kWh',
            ''
          )}
          unit={roomInfo.usage.highestComponent.name}
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
                {devices.length - online} Offline
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

            <Button
              variant="outline"
              size="icon"
              className="size-11 shrink-0 rounded-md md:size-8"
            >
              <CalendarDays className="size-4" />
            </Button>
          </>
        }
      >
        {selected.size > 0 && (
          <div className="flex w-full items-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSelected(new Set());
              }}
            >
              Clear selection ({selected.size})
            </Button>
          </div>
        )}

        {hasNoResults ? (
          <EmptyState
            icon={Smartphone}
            title={search ? 'No matching devices' : 'No devices yet'}
            description={
              search
                ? `No devices match "${search}". Try a different search term.`
                : 'This room does not have any devices yet.'
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
                            : new Set(devices.map((device) => device.id))
                        )
                      }
                    />
                  </TableHead>

                  <TableHead>Device(s)</TableHead>

                  <TableHead>Component</TableHead>

                  <TableHead>Total usage(24H)</TableHead>

                  <TableHead>Interval</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {devices.map((device) => (
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
      </TableToolbar>

      <DeviceLogModal
        device={logModal.device}
        logs={logModal.logs}
        loading={logModal.loading}
        open={logModal.open}
        onClose={closeDeviceLog}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Device"
        description={
          <>
            Are you sure you want to remove{' '}
            <span className="font-bold">
              &quot;
              {deleteTarget?.tbDeviceId}
              &quot;
            </span>{' '}
            from this room? This action cannot be undone.
          </>
        }
        confirming={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
