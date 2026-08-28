'use client';

import { useMemo, useState } from 'react';
import { Plus, Smartphone, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { AnalyticCard } from '@/components/shared/analytic-card';
import { SearchInput } from '@/components/shared/search-input';
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
import type { DeviceDTO } from '@/feat/device/dto';
import type { RoomListItemDTO } from '@/feat/rooms/dto';
import type { GatewayDTO } from '@/feat/gateway/dto';
import { DeviceFormModal } from './_partials/modal';

interface DeviceClientProps {
  initialData: DeviceDTO[];
  rooms: RoomListItemDTO[];
  gateways: GatewayDTO[];
}

export function DeviceClient({
  initialData,
  rooms,
  gateways,
}: DeviceClientProps) {
  const [devices, setDevices] = useState<DeviceDTO[]>(initialData ?? []);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    device?: DeviceDTO;
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<DeviceDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const online = devices.filter((d) => d.status === 'on').length;

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return devices;
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(normalized) ||
        d.eui.toLowerCase().includes(normalized) ||
        (d.room?.name ?? '').toLowerCase().includes(normalized)
    );
  }, [devices, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const handleTogglePower = async (device: DeviceDTO) => {
    const nextState = device.status !== 'on';
    try {
      await devicesClientApi.setPower(device.id, nextState);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === device.id ? { ...d, status: nextState ? 'on' : 'off' } : d
        )
      );
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
      setDevices((prev) => prev.filter((d) => d.id !== deleteTarget.id));
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

      setDevices((prev) => prev.filter((d) => !successfulIds.includes(d.id)));
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

  const columns = useMemo(
    () =>
      getDeviceColumns({
        isSelected: (id) => selected.has(id),
        onToggleSelect: (id) =>
          setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          }),
        onTogglePower: handleTogglePower,
        onEdit: (device) => setModalState({ open: true, device }),
        onDelete: (device) => setDeleteTarget(device),
      }),
    [selected]
  );

  const { sorted, sortKey, direction, toggleSort } = useTableSort(filtered, {
    name: (d) => d.name,
    component: (d) => d.deviceType,
    room: (d) => d.room?.name ?? '',
    gateway: (d) => d.gateway?.name ?? '',
    tbDeviceId: (d) => d.tbDeviceId,
    inverval: (d) => d.intervalMinutes,
    status: (d) => d.status,
  });

  const allSelected =
    paginated.length > 0 && paginated.every((d) => selected.has(d.id));

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Devices"
        description="Manage electrical devices connected to rooms and gateways."
        actions={
          <Button
            onClick={() => setModalState({ open: true })}
            className="w-[200px]"
          >
            <Plus className="size-4" /> Add device
          </Button>
        }
      />

      <div className="flex w-full items-stretch gap-2.5">
        <AnalyticCard
          title="Total device(s)"
          value={formatNumber(devices.length)}
          unit="all rooms"
        />
        <AnalyticCard
          title="On"
          value={formatNumber(online)}
          unit="device(s)"
        />
        <AnalyticCard
          title="Off"
          value={formatNumber(devices.length - online)}
          unit="device(s)"
          tone="red"
        />
      </div>

      <div className="flex w-full flex-col items-end gap-4 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-semibold text-emerald-500">
            {formatNumber(filtered.length)} device(s)
          </p>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by name, EUI, or room..."
          />
        </div>

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

        {filtered.length === 0 ? (
          <EmptyState
            icon={Smartphone}
            title={search ? 'No matching devices' : 'No devices yet'}
            description={
              search
                ? `No devices match "${search}". Try a different search term.`
                : 'Add your first device and connect it to a room and gateway.'
            }
            action={
              !search && (
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
                  <SortableTableHead
                    sortKey="status"
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
                    <TableCell>{columns.room(device)}</TableCell>
                    <TableCell>{columns.gateway(device)}</TableCell>
                    <TableCell>{columns.tbDeviceId(device)}</TableCell>
                    <TableCell>{columns.interval(device)}</TableCell>
                    <TableCell>{columns.status(device)}</TableCell>
                    <TableCell>{columns.action(device)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(next) => {
                setRowsPerPage(next);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

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

          setDevices((prev) => {
            const exists = prev.some((d) => d.id === enriched.id);
            if (exists)
              return prev.map((d) => (d.id === enriched.id ? enriched : d));
            return [enriched, ...prev];
          });

          const wasEditing = !!modalState.device;
          setModalState({ open: false });
          toast.success(wasEditing ? 'Device updated' : 'Device created');
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Device"
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
        title="Delete Devices"
        count={selected.size}
        itemLabel="device"
        confirming={bulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
