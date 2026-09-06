'use client';

import { useRef, useState } from 'react';
import { Plus, Users, Trash2, CalendarDays } from 'lucide-react';
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
import { Pagination } from '@/components/ui/pagination';
import { toast } from '@/lib/toast-store';
import { formatNumber } from '@/lib/utils';
import { useTableSort } from '@/lib/use-table-sort';
import { getUserColumns } from '@/column/user';
import { usersClientApi } from '@/feat/user/api.client';
import type { UserDTO, UserListResponseDTO } from '@/feat/user/dto';
import type { RoleDTO } from '@/feat/role/dto';
import { UserFormModal } from './_partials/modal';
import { UserDetailModal } from './_partials/detail-modal';
import { TableToolbar } from '@/components/shared/table-toolbar';

interface UserClientProps {
  initialData: UserListResponseDTO;
  roles: RoleDTO[];
}

const SEARCH_DEBOUNCE_MS = 250;

const USER_SORT_ACCESSORS = {
  fullName: (u: UserDTO) => u.fullName,
  address: (u: UserDTO) => u.address ?? '',
  role: (u: UserDTO) => u.role?.name ?? '',
  lastActiveAt: (u: UserDTO) =>
    u.lastActiveAt ? new Date(u.lastActiveAt).getTime() : null,
};

export function UserClient({ initialData, roles }: UserClientProps) {
  const [data, setData] = useState<UserListResponseDTO>(
    initialData ?? {
      data: [],
      page: 1,
      rowsPerPage: 10,
      totalRows: 0,
      totalPages: 1,
    }
  );
  const [page, setPage] = useState(initialData.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.rowsPerPage);
  const [search, setSearch] = useState('');
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

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUsers = async (
    nextPage: number,
    nextRowsPerPage: number,
    nextSearch: string
  ) => {
    try {
      const result = await usersClientApi.list({
        page: nextPage,
        rowsPerPage: nextRowsPerPage,
        search: nextSearch,
      });
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load users');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadUsers(1, rowsPerPage, value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    loadUsers(nextPage, rowsPerPage, search);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
    loadUsers(1, nextRowsPerPage, search);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(usersClientApi.remove(deleteTarget.id), {
        loading: `Deleting ${deleteTarget.fullName}...`,
        success: 'User has been deleted',
      });
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((u) => u.id !== deleteTarget.id),
        totalRows: Math.max(0, prev.totalRows - 1),
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
        ids.map((id) => usersClientApi.remove(id))
      );
      const successfulIds = ids.filter(
        (_, index) => results[index].status === 'fulfilled'
      );
      const failedCount = results.length - successfulIds.length;

      setData((prev) => ({
        ...prev,
        data: prev.data.filter((u) => !successfulIds.includes(u.id)),
        totalRows: Math.max(0, prev.totalRows - successfulIds.length),
      }));
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

  const columns = getUserColumns({
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
  });

  const { sorted, sortKey, direction, toggleSort } = useTableSort(
    data.data,
    USER_SORT_ACCESSORS
  );

  const allSelected =
    sorted.length > 0 && sorted.every((u) => selected.has(u.id));

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Users"
        description="Manage users and their access to the Energy Management System."
        actions={
          <Button
            onClick={() => setModalState({ open: true })}
            className="w-full md:w-[200px]"
          >
            <Plus className="size-4" /> Add user
          </Button>
        }
      />

      <TableToolbar
        summary={
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-emerald-500">
              {formatNumber(data.totalRows)} role(s)
            </p>
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
        {data.data.length === 0 ? (
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
                            : new Set(sorted.map((u) => u.id))
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
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((user) => (
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
              page={page}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </>
        )}
      </TableToolbar>
      <UserFormModal
        open={modalState.open}
        user={modalState.user}
        roles={roles}
        onOpenChange={(open) => setModalState({ open })}
        onSuccess={(saved) => {
          setData((prev) => {
            const exists = prev.data.some((u) => u.id === saved.id);
            return {
              ...prev,
              data: exists
                ? prev.data.map((u) => (u.id === saved.id ? saved : u))
                : [saved, ...prev.data],
              totalRows: exists ? prev.totalRows : prev.totalRows + 1,
            };
          });
          const wasEditing = !!modalState.user;
          setModalState({ open: false });
          toast.success(wasEditing ? 'User updated' : 'User created');
        }}
      />

      <UserDetailModal
        user={detailUser}
        roles={roles}
        onClose={() => setDetailUser(null)}
      />

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
