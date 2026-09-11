'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, UserCog, Trash2 } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { PageHeader } from '@/components/shared/page-header';
import { AnalyticCard } from '@/components/shared/analytic-card';
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
import { Pagination } from '@/components/ui/pagination';
import { toast } from '@/lib/toast-store';
import { formatNumber } from '@/lib/utils';
import { useTableSort } from '@/lib/use-table-sort';
import { getRoleColumns } from '@/column/role';
import { rolesClientApi } from '@/feat/role/api.client';
import type {
  RoleDTO,
  PermissionDTO,
  RoleListResponseDTO,
} from '@/feat/role/dto';
import { RoleFormModal } from './_partials/modal';
import { RoleDetailDrawer } from './_partials/detail-drawer';
import { TableToolbar } from '@/components/shared/table-toolbar';

interface RoleClientProps {
  initialData: RoleListResponseDTO;
  permissions: PermissionDTO[];
}

const SEARCH_DEBOUNCE_MS = 250;

const ROLE_SORT_ACCESSORS = {
  name: (r: RoleDTO) => r.name,
  users: (r: RoleDTO) => r._count?.users ?? 0,
  permissions: (r: RoleDTO) => r.permissions?.length ?? 0,
};

export function RoleClient({ initialData, permissions }: RoleClientProps) {
  const [data, setData] = useState<RoleListResponseDTO>(
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
  const [isFetching, setIsFetching] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
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

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadRolesRequestRef = useRef(0);

  const loadRoles = useCallback(
    async (nextPage: number, nextRowsPerPage: number, nextSearch: string) => {
      const requestId = ++loadRolesRequestRef.current;
      setIsFetching(true);
      try {
        const result = await rolesClientApi.list({
          page: nextPage,
          rowsPerPage: nextRowsPerPage,
          search: nextSearch,
        });
        if (requestId !== loadRolesRequestRef.current) return;
        setData(result);
      } catch (err) {
        if (requestId !== loadRolesRequestRef.current) return;
        toast.error(
          err instanceof Error ? err.message : 'Failed to load roles'
        );
      } finally {
        if (requestId === loadRolesRequestRef.current) setIsFetching(false);
      }
    },
    []
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadRoles(1, rowsPerPage, value);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleDateRangeApply = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
    loadRoles(1, rowsPerPage, search);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    loadRoles(nextPage, rowsPerPage, search);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
    loadRoles(1, nextRowsPerPage, search);
  };

  const deletableSelected = Array.from(selected).filter(
    (id) => !data.data.find((r) => r.id === id)?.isSystem
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(rolesClientApi.remove(deleteTarget.id), {
        loading: `Deleting ${deleteTarget.name}...`,
        success: 'Role has been deleted',
      });
      setData((prev) => ({
        ...prev,
        data: prev.data.filter((r) => r.id !== deleteTarget.id),
        totalRows: Math.max(0, prev.totalRows - 1),
      }));
      setDeleteTarget(null);
    } catch {
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

      setData((prev) => ({
        ...prev,
        data: prev.data.filter((r) => !successfulIds.includes(r.id)),
        totalRows: Math.max(0, prev.totalRows - successfulIds.length),
      }));
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

  const columns = getRoleColumns({
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
  });

  const { sorted, sortKey, direction, toggleSort } = useTableSort(
    data.data,
    ROLE_SORT_ACCESSORS
  );

  const allSelected =
    sorted.length > 0 && sorted.every((r) => selected.has(r.id));

  const systemCount = data.data.filter((r) => r.isSystem).length;

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Roles"
        description="Manage roles and assign granular permissions."
        actions={
          <Button
            onClick={() => setModalState({ open: true })}
            className="w-full md:w-[200px]"
          >
            <Plus className="size-4" /> Add role
          </Button>
        }
      />

      <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-3">
        <AnalyticCard
          title="Total role(s)"
          value={formatNumber(data.totalRows)}
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
              <SearchInput value={search} onChange={handleSearchChange} />
            </div>
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
              icon={UserCog}
              title={
                search || dateRange?.from ? 'No matching roles' : 'No roles yet'
              }
              description={
                search
                  ? `No roles match "${search}". Try a different search term.`
                  : dateRange?.from
                    ? 'No roles were created in this date range.'
                    : 'Create a role and assign the permissions its members need.'
              }
              action={
                !search &&
                !dateRange?.from && (
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
                              : new Set(sorted.map((r) => r.id))
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
                      sortKey="users"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Users
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="permissions"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Permission
                    </SortableTableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>{columns.checkbox(role)}</TableCell>
                      <TableCell>{columns.role(role)}</TableCell>
                      <TableCell>{columns.users(role)}</TableCell>
                      <TableCell>{columns.permissionCount(role)}</TableCell>
                      <TableCell>{columns.action(role)}</TableCell>
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

      <RoleFormModal
        open={modalState.open}
        role={modalState.role}
        permissions={permissions}
        onOpenChange={(open) => setModalState({ open })}
        onSuccess={(saved) => {
          setData((prev) => {
            const exists = prev.data.some((r) => r.id === saved.id);
            return {
              ...prev,
              data: exists
                ? prev.data.map((r) => (r.id === saved.id ? saved : r))
                : [saved, ...prev.data],
              totalRows: exists ? prev.totalRows : prev.totalRows + 1,
            };
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
