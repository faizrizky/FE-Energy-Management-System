'use client';

import { useMemo, useState } from 'react';
import { Plus, UserCog, Trash2 } from 'lucide-react';
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
import { toast } from '@/lib/toast-store';
import { formatNumber } from '@/lib/utils';
import { getRoleColumns } from '@/column/role';
import { rolesClientApi } from '@/feat/role/api.client';
import type { RoleDTO, PermissionDTO } from '@/feat/role/dto';
import { RoleFormModal } from './_partials/modal';
import { RoleDetailDrawer } from './_partials/detail-drawer';

interface RoleClientProps {
  initialData: RoleDTO[];
  permissions: PermissionDTO[];
}

export function RoleClient({ initialData, permissions }: RoleClientProps) {
  const [roles, setRoles] = useState<RoleDTO[]>(initialData ?? []);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    role?: RoleDTO;
  }>({ open: false });
  const [detailRole, setDetailRole] = useState<RoleDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const systemCount = roles.filter((r) => r.isSystem).length;

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(normalized));
  }, [roles, search]);

  // Cuma role non-system yang boleh masuk bulk delete, biar gak ke-select
  // diam-diam terus dihapus barengan role custom lain.
  const deletableSelected = Array.from(selected).filter(
    (id) => !roles.find((r) => r.id === id)?.isSystem
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(rolesClientApi.remove(deleteTarget.id), {
        loading: `Deleting ${deleteTarget.name}...`,
        success: 'Role has been deleted',
      });
      setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // Kemungkinan gagal kalau masih ada user yang pakai role ini
      // (FK RESTRICT di schema.prisma) — toast.promise sudah menampilkan pesan errornya.
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    const ids = deletableSelected;
    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => rolesClientApi.remove(id))
      );
      const successfulIds = ids.filter(
        (_, index) => results[index].status === 'fulfilled'
      );
      const failedCount = results.length - successfulIds.length;

      setRoles((prev) => prev.filter((r) => !successfulIds.includes(r.id)));
      setSelected(new Set());
      setBulkDeleteOpen(false);

      if (failedCount === 0) {
        toast.success(`${successfulIds.length} role(s) deleted`);
      } else {
        toast.error(`${successfulIds.length} deleted, ${failedCount} failed`);
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns = useMemo(
    () =>
      getRoleColumns({
        isSelected: (id) => selected.has(id),
        onToggleSelect: (id) =>
          setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          }),
        onView: (role) => setDetailRole(role),
        onEdit: (role) => setModalState({ open: true, role }),
        onDelete: (role) => setDeleteTarget(role),
      }),
    [selected]
  );

  const allSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Roles"
        description="Manage roles and assign granular permissions."
        actions={
          <Button
            onClick={() => setModalState({ open: true })}
            className="w-[200px]"
          >
            <Plus className="size-4" /> Add role
          </Button>
        }
      />

      <div className="flex w-full items-stretch gap-2.5">
        <AnalyticCard
          title="Total role(s)"
          value={formatNumber(roles.length)}
          unit="configured"
        />
        <AnalyticCard
          title="System roles"
          value={formatNumber(systemCount)}
          unit="protected"
        />
        <AnalyticCard
          title="Total permission(s)"
          value={formatNumber(permissions.length)}
          unit="available"
        />
      </div>

      <div className="flex w-full flex-col items-end gap-4 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-semibold text-emerald-500">
            {formatNumber(filtered.length)} role(s)
          </p>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search role..."
          />
        </div>

        {deletableSelected.length > 0 && (
          <div className="flex w-full items-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete ({deletableSelected.length})
            </Button>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title={search ? 'No matching roles' : 'No roles yet'}
            description={
              search
                ? `No roles match "${search}". Try a different search term.`
                : 'Create a role and assign the permissions its members need.'
            }
            action={
              !search && (
                <Button
                  onClick={() => setModalState({ open: true })}
                  className="w-[200px]"
                >
                  <Plus className="size-4" /> Add role
                </Button>
              )
            }
          />
        ) : (
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
                          : new Set(filtered.map((r) => r.id))
                      )
                    }
                  />
                </TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{columns.checkbox(role)}</TableCell>
                  <TableCell>{columns.role(role)}</TableCell>
                  <TableCell>{columns.permissionCount(role)}</TableCell>
                  <TableCell>{columns.type(role)}</TableCell>
                  <TableCell>{columns.action(role)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <RoleFormModal
        open={modalState.open}
        role={modalState.role}
        permissions={permissions}
        onOpenChange={(open) => setModalState({ open })}
        onSuccess={(saved) => {
          setRoles((prev) => {
            const exists = prev.some((r) => r.id === saved.id);
            if (exists) return prev.map((r) => (r.id === saved.id ? saved : r));
            return [saved, ...prev];
          });
          const wasEditing = !!modalState.role;
          setModalState({ open: false });
          toast.success(wasEditing ? 'Role updated' : 'Role created');
        }}
      />

      <RoleDetailDrawer role={detailRole} onClose={() => setDetailRole(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Role"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-bold">&quot;{deleteTarget?.name}&quot;</span>?
            Users currently on this role will need to be reassigned. This action
            cannot be undone.
          </>
        }
        confirming={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete Roles"
        count={deletableSelected.length}
        itemLabel="role"
        confirming={bulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
