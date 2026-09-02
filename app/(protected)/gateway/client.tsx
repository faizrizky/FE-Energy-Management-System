'use client';

import { useCallback, useRef, useState } from 'react';
import { Plus, ListFilter, Router, CalendarDays } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
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
import { TableToolbar } from '@/components/shared/table-toolbar';
import { Pagination } from '@/components/ui/pagination';
import { toast } from '@/lib/toast-store';
import { formatNumber } from '@/lib/utils';
import { useTableSort } from '@/lib/use-table-sort';
import { getGatewayColumns } from '@/column/gateway';
import { gatewaysClientApi } from '@/feat/gateway/api.client';

import type {
  GatewayDTO,
  GatewayDetailDTO,
  GatewayListResponseDTO,
} from '@/feat/gateway/dto';

import type { UserSummaryDTO } from '@/feat/user/dto';
import { GatewayFormModal } from './_partials/modal';
import { GatewayDetailModal } from './_partials/detail-modal';
import { StatusDot } from '@/components/shared/status-dot';

interface GatewayClientProps {
  initialData: GatewayListResponseDTO;
  users: UserSummaryDTO[];
}

const SEARCH_DEBOUNCE_MS = 250;

export function GatewayClient({ initialData, users }: GatewayClientProps) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(initialData.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.rowsPerPage);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    gateway?: GatewayDTO;
  }>({
    open: false,
  });
  const [deleteTarget, setDeleteTarget] = useState<GatewayDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailState, setDetailState] = useState<{
    open: boolean;
    gateway: GatewayDetailDTO | null;
    loading: boolean;
  }>({ open: false, gateway: null, loading: false });

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const online = data.data.filter(
    (gateway) => gateway.status === 'online'
  ).length;

  const loadGateways = useCallback(
    async (nextPage: number, nextRowsPerPage: number, nextSearch: string) => {
      try {
        const result = await gatewaysClientApi.list({
          page: nextPage,
          rowsPerPage: nextRowsPerPage,
          search: nextSearch,
        });
        setData(result);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load gateways'
        );
      }
    },
    []
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadGateways(1, rowsPerPage, value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    loadGateways(nextPage, rowsPerPage, search);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
    loadGateways(1, nextRowsPerPage, search);
  };

  const openGatewayDetail = async (gateway: GatewayDTO) => {
    setDetailState({ open: true, gateway: null, loading: true });
    try {
      const result = await gatewaysClientApi.getById(gateway.id);
      setDetailState({ open: true, gateway: result, loading: false });
    } catch (err) {
      setDetailState({ open: true, gateway: null, loading: false });
      toast.error(
        err instanceof Error ? err.message : 'Failed to load gateway detail'
      );
    }
  };

  const closeGatewayDetail = () => {
    setDetailState({ open: false, gateway: null, loading: false });
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
      // toast.promise sudah nampilin error-nya
    } finally {
      setDeleting(false);
    }
  };

  const { sorted, sortKey, direction, toggleSort } = useTableSort(data.data, {
    name: (g) => g.name,
    status: (g) => g.status,
  });

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
                <SearchInput
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search gateway..."
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
          {data.data.length === 0 ? (
            <EmptyState
              icon={Router}
              title={search ? 'No matching gateways' : 'No gateways yet'}
              description={
                search
                  ? `No gateways match "${search}". Try a different search term.`
                  : 'Add your first gateway to start connecting devices.'
              }
              action={
                !search && (
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
              loadGateways(1, rowsPerPage, search);
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
      </div>

      {detailState.open && (
        <GatewayDetailModal
          gateway={detailState.gateway}
          loading={detailState.loading}
          onClose={closeGatewayDetail}
        />
      )}
    </>
  );
}
