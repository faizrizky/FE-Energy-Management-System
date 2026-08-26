'use client';

import { useEffect, useState } from 'react';
import { Plus, ListFilter, Router } from 'lucide-react';
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
import type { GatewayDTO, GatewayListResponseDTO } from '@/feat/gateway/dto';
import type { UserSummaryDTO } from '@/feat/user/dto';
import { GatewayFormModal } from './_partials/modal';

interface GatewayClientProps {
  initialData: GatewayListResponseDTO;
  users: UserSummaryDTO[];
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
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<GatewayDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const online = data.data.filter((g) => g.status === 'online').length;

  // Server-driven pagination/search sekarang backend-nya support (GET /gateways
  // sudah terima page/rowsPerPage/search — lihat gateway.usecase.js#listGatewaysPaginated).
  useEffect(() => {
    const timeout = setTimeout(() => {
      api
        .get<GatewayListResponseDTO>('/gateways', {
          params: { page, rowsPerPage, search: search || undefined },
        })
        .then((res) => setData(res.data))
        .catch((err) =>
          toast.error(
            err instanceof Error ? err.message : 'Failed to load gateways'
          )
        );
    }, 250);
    return () => clearTimeout(timeout);
  }, [page, rowsPerPage, search]);

  const columns = getGatewayColumns({
    isSelected: (id) => selected.has(id),
    onToggleSelect: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    onView: (gateway) => (window.location.href = `/gateway/${gateway.id}`),
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
        data: prev.data.filter((g) => g.id !== deleteTarget.id),
      }));
      setDeleteTarget(null);
    } catch {
      // toast.promise sudah menampilkan error dari backend
    } finally {
      setDeleting(false);
    }
  };

  const allSelected =
    data.data.length > 0 && data.data.every((g) => selected.has(g.id));

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Gateways"
        description="Monitor and manage gateway connections across your facility."
        actions={
          <Button
            onClick={() => setModalState({ open: true })}
            className="w-[200px]"
          >
            <Plus className="size-4" /> Add gateway
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
              <span className="text-emerald-500">{online} Online</span>
              <span className="text-status-error">
                {data.data.length - online} Offline
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search gateway"
            />
            <Button
              variant="outline"
              size="sm"
              className="w-[150px] justify-between"
            >
              <ListFilter className="size-4" /> Filter
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
                  onClick={() => setModalState({ open: true })}
                  className="w-[200px]"
                >
                  <Plus className="size-4" /> Add gateway
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
                            : new Set(data.data.map((g) => g.id))
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
                    <TableCell>{columns.status(gateway)}</TableCell>
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
              onRowsPerPageChange={(n) => {
                setRowsPerPage(n);
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
              ? prev.data.map((g) => (g.id === saved.id ? saved : g))
              : prev.data,
          }));
          toast.success(
            modalState.gateway
              ? 'Gateway has been updated'
              : 'Gateway has been created'
          );
          setModalState({ open: false });
          if (!modalState.gateway) {
            // Item baru — paling gampang refetch page 1 daripada tebak-tebak urutan sort backend.
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
            <span className="font-bold">&quot;{deleteTarget?.name}&quot;</span>?
            This action cannot be undone.
          </>
        }
        confirming={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
