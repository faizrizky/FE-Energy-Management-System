'use client';

import { useEffect, useState } from 'react';
import { Eye, Plus, ListFilter, Router, X } from 'lucide-react';

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
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { api } from '@/lib/axios';
import { toast } from '@/lib/toast-store';
import { formatNumber } from '@/lib/utils';
import { getGatewayColumns } from '@/column/gateway';
import { gatewaysClientApi } from '@/feat/gateway/api.client';

import type {
  GatewayDTO,
  GatewayDetailDTO,
  GatewayListResponseDTO,
} from '@/feat/gateway/dto';

import type { UserSummaryDTO } from '@/feat/user/dto';
import { GatewayFormModal } from './_partials/modal';

interface GatewayClientProps {
  initialData: GatewayListResponseDTO;
  users: UserSummaryDTO[];
}

function formatDate(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function GatewayStatus({ status }: { status?: string | null }) {
  const online = status?.toLowerCase() === 'online';

  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          'size-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]',
          online
            ? 'bg-emerald-500'
            : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
        ].join(' ')}
      />

      <span
        className={[
          'text-xs',
          online ? 'text-emerald-500' : 'text-red-500',
        ].join(' ')}
      >
        {online ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}

interface GatewayDetailDrawerProps {
  gateway: GatewayDetailDTO | null;
  loading: boolean;
  onClose: () => void;
}

function GatewayDetailDrawer({
  gateway,
  loading,
  onClose,
}: GatewayDetailDrawerProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-white/10 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="fixed right-0 top-0 z-50 flex h-full w-[450px] flex-col border-l border-neutral-300 bg-white p-6 shadow-[0_8px_12px_rgba(0,0,0,0.05)]">
        <div className="flex w-full flex-col gap-4">
          <div className="flex w-full items-center justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold leading-7 text-emerald-500">
                {loading ? 'Loading...' : (gateway?.name ?? 'Gateway')}
              </h2>

              <p className="text-sm font-medium leading-5 text-neutral-500">
                {loading ? '-' : (gateway?.eui ?? '-')}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50"
              aria-label="Close gateway detail"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="h-px w-full bg-slate-200" />

          <div className="flex w-full flex-col gap-4 py-2">
            <p className="text-xs font-normal leading-[18px] text-slate-600">
              Basic information
            </p>

            {loading ? (
              <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-[0_8px_12px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col gap-3">
                  <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-4/5 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ) : gateway ? (
              <div className="flex w-full flex-col gap-2 rounded-xl border border-neutral-300 bg-white p-4 text-sm leading-5 shadow-[0_8px_12px_rgba(0,0,0,0.05)]">
                <div className="flex items-start justify-between gap-6">
                  <p className="shrink-0 font-medium text-neutral-500">
                    Installed by
                  </p>

                  <p className="text-right font-normal text-slate-950">
                    {gateway.installedBy?.fullName ?? '-'}
                  </p>
                </div>

                <div className="flex items-start justify-between gap-6">
                  <p className="shrink-0 font-medium text-neutral-500">
                    Created by
                  </p>

                  <p className="text-right font-normal text-slate-950">
                    {gateway.installedBy?.fullName ?? '-'}
                  </p>
                </div>

                <div className="flex items-start justify-between gap-6">
                  <p className="shrink-0 font-medium text-neutral-500">
                    Updated by
                  </p>

                  <p className="text-right font-normal text-slate-950">
                    {gateway.installedBy?.fullName ?? '-'}
                  </p>
                </div>

                <p className="pt-1 font-normal text-slate-950">
                  {gateway.description || '-'}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  Failed to load gateway detail.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

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
  }>({
    open: false,
    gateway: null,
    loading: false,
  });

  const online = data.data.filter(
    (gateway) => gateway.status === 'online'
  ).length;

  useEffect(() => {
    const timeout = setTimeout(() => {
      api
        .get<GatewayListResponseDTO>('/gateways', {
          params: {
            page,
            rowsPerPage,
            search: search || undefined,
          },
        })
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => {
          toast.error(
            err instanceof Error ? err.message : 'Failed to load gateways'
          );
        });
    }, 250);

    return () => clearTimeout(timeout);
  }, [page, rowsPerPage, search]);

  const openGatewayDetail = async (gateway: GatewayDTO) => {
    setDetailState({
      open: true,
      gateway: null,
      loading: true,
    });

    try {
      const result = await api.get<GatewayDetailDTO>(`/gateways/${gateway.id}`);

      setDetailState({
        open: true,
        gateway: result.data,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to load gateway detail:', error);

      setDetailState({
        open: true,
        gateway: null,
        loading: false,
      });

      toast.error(
        error instanceof Error ? error.message : 'Failed to load gateway detail'
      );
    }
  };

  const closeGatewayDetail = () => {
    setDetailState({
      open: false,
      gateway: null,
      loading: false,
    });
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

    onEdit: (gateway) =>
      setModalState({
        open: true,
        gateway,
      }),

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
      // toast.promise already handles backend error
    } finally {
      setDeleting(false);
    }
  };

  const allSelected =
    data.data.length > 0 &&
    data.data.every((gateway) => selected.has(gateway.id));

  return (
    <>
      <div className="flex w-full flex-1 flex-col  items-start gap-8 overflow-y-auto bg-slate-50 p-8">
        <PageHeader
          title="Gateways"
          description="Monitor and manage gateway connections across your facility."
          actions={
            <Button
              onClick={() => setModalState({ open: true })}
              className="w-[200px]"
            >
              <Plus className="size-4" />
              Add gateway
            </Button>
          }
        />

        <div className="flex w-full flex-col items-end gap-4 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-emerald-500">
                {formatNumber(data.totalRows)} gateway(s)
              </p>

              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  {online} Online
                </span>

                <span className="flex items-center gap-1.5 text-red-500">
                  <span className="size-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                  {data.data.length - online} Offline
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Search gateway"
              />

              <Button
                variant="outline"
                size="sm"
                className="w-[150px] justify-between"
              >
                <ListFilter className="size-4" />
                Filter
              </Button>
            </div>
          </div>

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
                    onClick={() =>
                      setModalState({
                        open: true,
                      })
                    }
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
                              : new Set(data.data.map((gateway) => gateway.id))
                          )
                        }
                      />
                    </TableHead>

                    <TableHead>Gateway</TableHead>

                    <TableHead>Model unit</TableHead>

                    <TableHead>Simcard</TableHead>

                    <TableHead>Installation</TableHead>

                    <TableHead>Source</TableHead>

                    <TableHead>Status</TableHead>

                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.data.map((gateway) => (
                    <TableRow key={gateway.id}>
                      <TableCell>{columns.checkbox(gateway)}</TableCell>

                      <TableCell>{columns.gateway(gateway)}</TableCell>

                      <TableCell>{columns.modelUnit(gateway)}</TableCell>

                      <TableCell>{columns.simcard(gateway)}</TableCell>

                      <TableCell>{columns.installation(gateway)}</TableCell>

                      <TableCell>{columns.source(gateway)}</TableCell>

                      <TableCell>
                        <GatewayStatus status={gateway.status} />
                      </TableCell>

                      <TableCell>{columns.action(gateway)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination
                page={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(value) => {
                  setRowsPerPage(value);
                  setPage(1);
                }}
              />
            </>
          )}
        </div>

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

            setModalState({
              open: false,
            });

            if (!modalState.gateway) {
              setPage(1);
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
        <GatewayDetailDrawer
          gateway={detailState.gateway}
          loading={detailState.loading}
          onClose={closeGatewayDetail}
        />
      )}
    </>
  );
}
