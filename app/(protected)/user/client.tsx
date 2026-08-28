'use client';

import { useMemo, useState } from 'react';
import { Plus, Users, Trash2 } from 'lucide-react';
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
import { getUserColumns } from '@/column/user';
import { usersClientApi } from '@/feat/user/api.client';
import type { UserDTO } from '@/feat/user/dto';
import type { RoleDTO } from '@/feat/role/dto';
import { UserFormModal } from './_partials/modal';
import { UserDetailDrawer } from './_partials/detail-drawer';

interface UserClientProps {
  initialData: UserDTO[];
  roles: RoleDTO[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function UserClient({ initialData, roles }: UserClientProps) {
  const [users, setUsers] = useState<UserDTO[]>(initialData ?? []);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    user?: UserDTO;
  }>({ open: false });
  const [detailUser, setDetailUser] = useState<UserDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const activeRecently = users.filter(
    (u) =>
      u.lastActiveAt &&
      Date.now() - new Date(u.lastActiveAt).getTime() <= DAY_MS
  ).length;

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(normalized) ||
        u.username.toLowerCase().includes(normalized) ||
        u.email.toLowerCase().includes(normalized)
    );
  }, [users, search]);

  const { sorted, sortKey, direction, toggleSort } = useTableSort(filtered, {
    fullName: (u) => u.fullName,
    address: (u) => u.address ?? '',
    role: (u) => u.role?.name ?? '',
    lastActiveAt: (u) =>
      u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : null,
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(usersClientApi.remove(deleteTarget.id), {
        loading: `Deleting ${deleteTarget.fullName}...`,
        success: 'User has been deleted',
      });
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
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
        ids.map((id) => usersClientApi.remove(id))
      );
      const successfulIds = ids.filter(
        (_, index) => results[index].status === 'fulfilled'
      );
      const failedCount = results.length - successfulIds.length;

      setUsers((prev) => prev.filter((u) => !successfulIds.includes(u.id)));
      setSelected(new Set());
      setBulkDeleteOpen(false);

      if (failedCount === 0) {
        toast.success(`${successfulIds.length} user(s) deleted`);
      } else {
        toast.error(`${successfulIds.length} deleted, ${failedCount} failed`);
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  const columns = useMemo(
    () =>
      getUserColumns({
        isSelected: (id) => selected.has(id),
        onToggleSelect: (id) =>
          setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          }),
        onView: (user) => setDetailUser(user),
        onEdit: (user) => setModalState({ open: true, user }),
        onDelete: (user) => setDeleteTarget(user),
      }),
    [selected]
  );

  const allSelected =
    paginated.length > 0 && paginated.every((u) => selected.has(u.id));

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Users"
        description="Manage users and their access to the Energy Management System."
        actions={
          <Button
            onClick={() => setModalState({ open: true })}
            className="w-[200px]"
          >
            <Plus className="size-4" /> Add user
          </Button>
        }
      />

      {/* <div className="flex w-full items-stretch gap-2.5">
        <AnalyticCard
          title="Total user(s)"
          value={formatNumber(users.length)}
          unit="all roles"
        />
        <AnalyticCard
          title="Active roles"
          value={formatNumber(roles.length)}
          unit="configured"
        />
        <AnalyticCard
          title="Active today"
          value={formatNumber(activeRecently)}
          unit="last 24h"
        />
      </div> */}

      <div className="flex w-full flex-col items-end gap-4 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-semibold text-emerald-500">
            {formatNumber(filtered.length)} user(s)
          </p>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by name, username, or email..."
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
            icon={Users}
            title={search ? 'No matching users' : 'No users yet'}
            description={
              search
                ? `No users match "${search}". Try a different search term.`
                : 'Create your user to manage room, gateway, and device.'
            }
            action={
              !search && (
                <Button
                  onClick={() => setModalState({ open: true })}
                  className="w-[200px]"
                >
                  <Plus className="size-4" /> Add user
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
                            : new Set(paginated.map((u) => u.id))
                        )
                      }
                    />
                  </TableHead>
                  <SortableTableHead
                    sortKey="fullName"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={toggleSort}
                  >
                    Name
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="address"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={toggleSort}
                  >
                    Address
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="role"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={toggleSort}
                  >
                    Role
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="lastActiveAt"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={toggleSort}
                  >
                    Last active
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{columns.checkbox(user)}</TableCell>
                    <TableCell>{columns.user(user)}</TableCell>
                    <TableCell>{columns.address(user)}</TableCell>
                    <TableCell>{columns.role(user)}</TableCell>
                    <TableCell>{columns.lastActive(user)}</TableCell>
                    <TableCell>{columns.action(user)}</TableCell>
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

      <UserFormModal
        open={modalState.open}
        user={modalState.user}
        roles={roles}
        onOpenChange={(open) => setModalState({ open })}
        onSuccess={(saved) => {
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === saved.id);
            if (exists) return prev.map((u) => (u.id === saved.id ? saved : u));
            return [saved, ...prev];
          });
          const wasEditing = !!modalState.user;
          setModalState({ open: false });
          toast.success(wasEditing ? 'User updated' : 'User created');
        }}
      />

      <UserDetailDrawer user={detailUser} onClose={() => setDetailUser(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-bold">
              &quot;{deleteTarget?.fullName}&quot;
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
        title="Delete Users"
        count={selected.size}
        itemLabel="user"
        confirming={bulkDeleting}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
