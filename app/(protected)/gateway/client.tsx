'use client';

import { useMemo, useState } from 'react';
import { Plus, Router, Trash2 } from 'lucide-react';
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
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { toast } from '@/lib/toast-store';
import { formatNumber } from '@/lib/utils';
import { getGatewayColumns } from '@/column/gateway';
import { gatewaysClientApi } from '@/feat/gateway/api.client';
import type { GatewayDTO } from '@/feat/gateway/dto';
import { GatewayFormModal } from './_partials/modal';

interface GatewayClientProps {
  initialData: GatewayDTO[];
}

// NOTE: backend GET /gateways has no pagination/search/stats (plain findMany,
// see gateway.usecase.js#listGateways), jadi search/pagination/summary
// dihitung client-side dari full list, sama kayak alasan yang udah dicatat
// di feat/gateway/api.ts.
export function GatewayClient({ initialData }: GatewayClientProps) {
  const [gateways, setGateways] = useState<GatewayDTO[]>(initialData ?? []);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    gateway?: GatewayDTO;
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<GatewayDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const online = gateways.filter((g) => g.status === 'online').length;

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return gateways;
    return gateways.filter(
      (g) =>
        g.name.toLowerCase().includes(normalized) ||
        g.eui.toLowerCase().includes(normalized)
    );
  }, [gateways, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(gatewaysClientApi.remove(deleteTarget.id), {
        loading: `Deleting ${deleteTarget.name}...`,
        success: 'Gateway has been deleted',
      });
      setGateways((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // toast.promise sudah menampilkan toast.error
    } finally {
      setDeleting(false);
    }
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

      setGateways((prev) => prev.filter((g) => !successfulIds.includes(g.id)));
      setSelected(new Set());
      setBulkDeleteOpen(false);

      if (failedCount === 0) {
        toast.success(`${successfulIds.length} gateway(s) deleted`);
      } else {
        toast.error(`${successfulIds.length} deleted, ${failedCount} failed`);
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns = useMemo(
    () =>
      getGatewayColumns({
        isSelected: (id) => selected.has(id),
        onToggleSelect: (id) =>
          setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          }),
        // Belum ada halaman detail gateway; view sementara buka modal edit yang sama.
        onView: (gateway) => setModalState({ open: true, gateway }),
        onEdit: (gateway) => setModalState({ open: true, gateway }),
        onDelete: (gateway) => setDeleteTarget(gateway),
      }),
    [selected]
  );

  const allSelected =
    paginated.length > 0 && paginated.every((g) => selected.has(g.id));

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Gateways"
        description="Manage LoRaWAN gateways and monitor their connectivity."
        actions={
          <Button
            onClick={() => setModalState({ open: true })}
            className="w-[200px]"
          >
            <Plus className="size-4" /> Add gateway
          </Button>
        }
      />

      <div className="flex w-full items-stretch gap-2.5">
        <AnalyticCard
          title="Total gateway(s)"
          value={formatNumber(gateways.length)}
          unit="all locations"
        />
        <AnalyticCard
          title="Online"
          value={formatNumber(online)}
          unit="gateway(s)"
        />
        <AnalyticCard
          title="Offline"
          value={formatNumber(gateways.length - online)}
          unit="gateway(s)"
          tone="red"
        />
      </div>

      <div className="flex w-full flex-col items-end gap-4 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-semibold text-emerald-500">
            {formatNumber(filtered.length)} gateway(s)
          </p>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by name or EUI..."
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
            icon={Router}
            title={search ? 'No matching gateways' : 'No gateways yet'}
            description={
              search
                ? `No gateways match "${search}". Try a different search term.`
                : 'Add your first LoRaWAN gateway to start connecting devices.'
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
                            : new Set(paginated.map((g) => g.id))
                        )
                      }
                    />
                  </TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Model unit</TableHead>
                  <TableHead>Simcard</TableHead>
                  <TableHead>Installation date</TableHead>
                  <TableHead>Power source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((gateway) => (
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

      <GatewayFormModal
        open={modalState.open}
        gateway={modalState.gateway}
        onOpenChange={(open) => setModalState({ open })}
        onSuccess={(saved) => {
          setGateways((prev) => {
            const exists = prev.some((g) => g.id === saved.id);
            if (exists)
              return prev.map((g) =>
                g.id === saved.id ? { ...g, ...saved } : g
              );
            return [saved, ...prev];
          });
          const wasEditing = !!modalState.gateway;
          setModalState({ open: false });
          toast.success(wasEditing ? 'Gateway updated' : 'Gateway created');
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

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete Gateways"
        count={selected.size}
        itemLabel="gateway"
        confirming={bulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
