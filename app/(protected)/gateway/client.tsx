'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Router, Trash2 } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { PageHeader } from '@/components/shared/page-header';
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
import { TableToolbar } from '@/components/shared/table-toolbar';
import { Pagination } from '@/components/ui/pagination';
import { toast } from '@/lib/toast-store';
import { formatNumber } from '@/lib/utils';
import { useTableSort } from '@/lib/use-table-sort';
import { getGatewayColumns } from '@/column/gateway';
import { gatewaysClientApi } from '@/feat/gateway/api.client';
import { useRealtimeEvent } from '@/hooks/use-realtime-event';

import type {
  GatewayDTO,
  GatewayDetailDTO,
  GatewayListResponseDTO,
} from '@/feat/gateway/dto';

import type { UserSummaryDTO } from '@/feat/user/dto';
import { GatewayFormModal } from './_partials/modal';
import { GatewayDetailModal } from './_partials/detail-modal';
import { StatusDot } from '@/components/shared/status-dot';
import { connectSocket } from '@/lib/socket';

interface GatewayClientProps {
  initialData: GatewayListResponseDTO;
  users: UserSummaryDTO[];
}

const SEARCH_DEBOUNCE_MS = 250;

const GATEWAY_SORT_ACCESSORS = {
  name: (g: GatewayDTO) => g.name,
  status: (g: GatewayDTO) => g.status,
};

function toApiDate(date: Date | undefined) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function GatewayClient({ initialData, users }: GatewayClientProps) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(initialData.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.rowsPerPage);
  const [search, setSearch] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    gateway?: GatewayDTO;
  }>({
    open: false,
  });
  const [deleteTarget, setDeleteTarget] = useState<GatewayDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailGateway, setDetailGateway] = useState<GatewayDetailDTO | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadGatewaysRequestRef = useRef(0);

  const online = data.data.filter(
    (gateway) => gateway.status === 'online'
  ).length;

  const loadGateways = useCallback(
    async (
      nextPage: number,
      nextRowsPerPage: number,
      nextSearch: string,
      nextRange: DateRange | undefined
    ) => {
      setIsFetching(true);
      const requestId = ++loadGatewaysRequestRef.current;
      try {
        const result = await gatewaysClientApi.list({
          page: nextPage,
          rowsPerPage: nextRowsPerPage,
          search: nextSearch,
          createdFrom: toApiDate(nextRange?.from),
          createdTo: toApiDate(nextRange?.to),
        });
        if (requestId !== loadGatewaysRequestRef.current) return;
        setData(result);
      } catch (err) {
        if (requestId !== loadGatewaysRequestRef.current) return;
        toast.error(
          err instanceof Error ? err.message : 'Failed to load gateways'
        );
      } finally {
        if (requestId === loadGatewaysRequestRef.current) setIsFetching(false);
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
        () => loadGateways(page, rowsPerPage, search, dateRange),
        3000
      );
    };

    socket.on('device:status', scheduleRefresh);
    return () => {
      socket.off('device:status', scheduleRefresh);
      clearTimeout(timeout);
    };
  }, [page, rowsPerPage, search, dateRange, loadGateways]);

  useRealtimeEvent<{ gateway: GatewayDTO }>(
    'gateway:created',
    ({ gateway }) => {
      setData((prev) => ({
        ...prev,
        data: [gateway, ...prev.data],
        totalRows: prev.totalRows + 1,
      }));
    }
  );
  useRealtimeEvent<{ gateway: GatewayDTO }>(
    'gateway:updated',
    ({ gateway }) => {
      setData((prev) => ({
        ...prev,
        data: prev.data.map((g) => (g.id === gateway.id ? gateway : g)),
      }));
    }
  );
  useRealtimeEvent<{ gatewayId: string }>(
    'gateway:deleted',
    ({ gatewayId }) => {
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((g) => g.id !== gatewayId),
        totalRows: Math.max(0, prev.totalRows - 1),
      }));
    }
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadGateways(1, rowsPerPage, value, dateRange);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleDateRangeApply = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
    loadGateways(1, rowsPerPage, search, range);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    loadGateways(nextPage, rowsPerPage, search, dateRange);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
    loadGateways(1, nextRowsPerPage, search, dateRange);
  };

  const openGatewayDetail = async (gateway: GatewayDTO) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailGateway(null);

    try {
      const result = await gatewaysClientApi.getById(gateway.id);
      setDetailGateway(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load gateway detail'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeGatewayDetail = () => {
    setDetailOpen(false);
  };

  const handleConfirmBulkDelete = async () => {
    const ids = Array.from(selected);
    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => gatewaysClientApi.remove(id))
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

  const columns = getGatewayColumns({
    isSelected: (id) => selected.has(id),
    onToggleSelect: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    onView: openGatewayDetail,
    onEdit: (gateway) => setModalState({ open: true, gateway }),
    onDelete: (gateway) => setDeleteTarget(gateway),
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(gatewaysClientApi.remove(deleteTarget.id), {
        loading: `Deleting ${deleteTarget.name}...`,
        success: 'Gateway has been deleted',
      });
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((gateway) => gateway.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  const { sorted, sortKey, direction, toggleSort } = useTableSort(
    data.data,
    GATEWAY_SORT_ACCESSORS
  );

  const allSelected =
    data.data.length > 0 &&
    data.data.every((gateway) => selected.has(gateway.id));

  return (
    <>
      <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
        <PageHeader
          title="Gateways"
          description="Monitor and manage gateway connections across your facility."
          actions={
            <Button
              onClick={() => setModalState({ open: true })}
              className="w-full md:w-[200px]"
            >
              <Plus className="size-4" />
              Add gateway
            </Button>
          }
        />

        <TableToolbar
          summary={
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-emerald-500">
                {formatNumber(data.totalRows)} gateway(s)
              </p>

              <div className="flex gap-3">
                <StatusDot label={`${online} Online`} tone="success" />

                <StatusDot
                  label={`${data.data.length - online} Offline`}
                  tone="error"
                />
              </div>
            </div>
          }
          actions={
            <>
              <div className="min-w-0 flex-1 md:flex-none">
                <SearchInput value={search} onChange={handleSearchChange} />
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
                icon={Router}
                title={
                  search || dateRange?.from
                    ? 'No matching gateways'
                    : 'No gateways yet'
                }
                description={
                  search
                    ? `No gateways match "${search}". Try a different search term.`
                    : dateRange?.from
                      ? 'No gateways were created in this date range.'
                      : 'Add your first gateway to start connecting devices.'
                }
                action={
                  !search &&
                  !dateRange?.from && (
                    <Button
                      onClick={() => setModalState({ open: true })}
                      className="w-[200px]"
                    >
                      <Plus className="size-4" />
                      Add gateway
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
                                : new Set(sorted.map((gateway) => gateway.id))
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
                        Gateway
                      </SortableTableHead>

                      <TableHead>Model unit</TableHead>
                      <TableHead>Simcard</TableHead>
                      <TableHead>Installation</TableHead>
                      <TableHead>Source</TableHead>

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
                    {sorted.map((gateway) => (
                      <TableRow key={gateway.id}>
                        <TableCell>{columns.checkbox(gateway)}</TableCell>

                        <TableCell>{columns.gateway(gateway)}</TableCell>

                        <TableCell>{columns.modelUnit(gateway)}</TableCell>

                        <TableCell>{columns.simcard(gateway)}</TableCell>

                        <TableCell>{columns.installation(gateway)}</TableCell>

                        <TableCell>{columns.source(gateway)}</TableCell>

                        <TableCell>
                          <StatusDot
                            label={
                              gateway.status?.toLowerCase() === 'online'
                                ? 'Online'
                                : 'Offline'
                            }
                            tone={
                              gateway.status?.toLowerCase() === 'online'
                                ? 'success'
                                : 'error'
                            }
                          />
                        </TableCell>

                        <TableCell>{columns.action(gateway)}</TableCell>
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

        <GatewayFormModal
          open={modalState.open}
          gateway={modalState.gateway}
          users={users}
          onOpenChange={(open) => setModalState({ open })}
          onSuccess={(saved) => {
            setData((prev) => ({
              ...prev,
              data: modalState.gateway
                ? prev.data.map((gateway) =>
                    gateway.id === saved.id ? saved : gateway
                  )
                : prev.data,
            }));

            toast.success(
              modalState.gateway
                ? 'Gateway has been updated'
                : 'Gateway has been created'
            );

            setModalState({ open: false });

            if (!modalState.gateway) {
              setPage(1);
              loadGateways(1, rowsPerPage, search, dateRange);
            }
          }}
        />

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Gateway"
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

      <GatewayDetailModal
        open={detailOpen}
        gateway={detailGateway}
        loading={detailLoading}
        onOpenChange={setDetailOpen}
        onClose={closeGatewayDetail}
      />
    </>
  );
}
