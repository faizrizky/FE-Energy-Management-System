'use client';

import { useRef, useState } from 'react';
import { Plus, CalendarDays, Trash2 } from 'lucide-react';
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
import { getScheduleColumns } from '@/column/schedule';
import { scheduleClientApi } from '@/feat/schedule/api.client';
import {
  isCurrentlyActive,
  isUpcoming,
  isUpcomingWithin24Hours,
} from '@/feat/schedule/time';
import type { ScheduleDTO, ScheduleListResponseDTO } from '@/feat/schedule/dto';
import type { RoomListItemDTO } from '@/feat/rooms/dto';
import type { DeviceDTO } from '@/feat/device/dto';
import { ScheduleFormModal } from './_partials/modal';
import { ScheduleDetailModal } from './_partials/detail-modal';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { api } from '@/lib/axios';

interface ScheduleClientProps {
  initialData: ScheduleListResponseDTO;
  rooms: RoomListItemDTO[];
  devices: DeviceDTO[];
}

const SEARCH_DEBOUNCE_MS = 250;

type ScheduleTab = 'active' | 'upcoming';

export function ScheduleClient({
  initialData,
  rooms,
  devices,
}: ScheduleClientProps) {
  const [data, setData] = useState<ScheduleListResponseDTO>(
    initialData ?? {
      data: [],
      page: 1,
      rowsPerPage: 10,
      totalRows: 0,
      totalPages: 1,
    }
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(initialData.page);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.rowsPerPage);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<ScheduleTab>('active');
  const [modalState, setModalState] = useState<{
    open: boolean;
    schedule?: ScheduleDTO;
  }>({ open: false });
  const [detailSchedule, setDetailSchedule] = useState<ScheduleDTO | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<ScheduleDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSchedules = async (
    nextPage = page,
    nextRowsPerPage = rowsPerPage,
    nextSearch = search,
    nextTab = tab
  ) => {
    try {
      const res = await api.get<ScheduleListResponseDTO>('/schedules', {
        params: {
          page: nextPage,
          rowsPerPage: nextRowsPerPage,
          search: nextSearch || undefined,
          tab: nextTab,
        },
      });

      setData(res.data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load schedules'
      );
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadSchedules(1, rowsPerPage, value, tab);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    loadSchedules(nextPage, rowsPerPage, search, tab);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
    loadSchedules(1, nextRowsPerPage, search, tab);
  };

  const activeSchedules = data.data.filter(isCurrentlyActive);
  const upcomingWithin24Hours = data.data.filter(isUpcoming);
  // const activeSchedules = useMemo(
  //   () => schedules.filter(isCurrentlyActive),
  //   [schedules]
  // );
  // const upcomingSchedules = useMemo(
  //   () => schedules.filter(isUpcoming),
  //   [schedules]
  // );
  // const upcomingWithin24Hours = useMemo(
  //   () => schedules.filter(isUpcomingWithin24Hours),
  //   [schedules]
  // );

  const tabSchedules =
    tab === 'active' ? activeSchedules : upcomingWithin24Hours;

  // const filteredSchedules = useMemo(() => {
  //   const normalized = search.trim().toLowerCase();
  //   return tabSchedules.filter((schedule) => {
  //     const matchesSearch =
  //       !normalized ||
  //       [
  //         schedule.room?.name,
  //         schedule.room?.location,
  //         schedule.device?.name,
  //         schedule.device?.eui,
  //         schedule.device?.deviceType,
  //         schedule.action,
  //       ]
  //         .filter(Boolean)
  //         .some((value) => value!.toLowerCase().includes(normalized));

  //     const matchesComponent =
  //       !filterComponent || schedule.device?.deviceType === filterComponent;
  //     return matchesSearch && matchesComponent;
  //   });
  // }, [search, tabSchedules, filterComponent]);

  // const totalPages = Math.max(
  //   1,
  //   Math.ceil(filteredSchedules.length / rowsPerPage)
  // );
  // const safePage = Math.min(page, totalPages);
  // const paginatedSchedules = filteredSchedules.slice(
  //   (safePage - 1) * rowsPerPage,
  //   safePage * rowsPerPage
  // );

  const toggleSelected = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const columns = getScheduleColumns({
    isSelected: (id) => selected.has(id),

    onToggleSelect: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),

    onView: (schedule) => setDetailSchedule(schedule),

    onEdit: (schedule) =>
      setModalState({
        open: true,
        schedule,
      }),

    onDelete: (schedule) => setDeleteTarget(schedule),
  });

  const { sorted, sortKey, direction, toggleSort } = useTableSort(
    tabSchedules,
    {
      room: (s) => s.room?.name ?? '',
      component: (s) => s.device?.deviceType ?? '',
      deviceEui: (s) => s.device?.eui ?? '',
      date: (s) => new Date(s.scheduledDate).getTime(),
      time: (s) => s.startTime,
      repeat: (s) => s.repeatType,
    }
  );

  const allSelected =
    sorted.length > 0 && sorted.every((schedule) => selected.has(schedule.id));

  const selectedSchedules = data.data.filter((schedule) =>
    selected.has(schedule.id)
  );

  const togglePageSelection = () => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (allSelected) {
        data.data.forEach((schedule) => next.delete(schedule.id));
      } else {
        data.data.forEach((schedule) => next.add(schedule.id));
      }
      return next;
    });
  };

  const changeTab = (nextTab: ScheduleTab) => {
    setTab(nextTab);
    setPage(1);
    setSelected(new Set());
    loadSchedules(1, rowsPerPage, search, nextTab);
  };

  const handleSave = async (saved: ScheduleDTO) => {
    await loadSchedules(page, rowsPerPage, search);
    setModalState({ open: false });
    toast.success('Schedule saved successfully');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await toast.promise(scheduleClientApi.remove(deleteTarget.id), {
        loading: 'Deleting schedule...',
        success: 'Schedule deleted',
      });
      await loadSchedules(page, rowsPerPage, search);
      setSelected((previous) => {
        const next = new Set(previous);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => scheduleClientApi.remove(id))
      );
      const successfulIds = ids.filter(
        (_, index) => results[index].status === 'fulfilled'
      );
      const failedCount = results.length - successfulIds.length;

      await loadSchedules(page, rowsPerPage, search);

      setSelected(new Set());
      setBulkDeleteOpen(false);

      if (failedCount === 0) {
        toast.success(`${successfulIds.length} schedule(s) deleted`);
      } else {
        toast.error(`${successfulIds.length} deleted, ${failedCount} failed`);
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Schedules"
        description="Manage scheduled actions for rooms and electrical devices."
        actions={
          <Button
            onClick={() => setModalState({ open: true })}
            className="w-full md:w-[200px]"
          >
            <Plus className="size-4" />
            Add schedule
          </Button>
        }
      />

      <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-3">
        <AnalyticCard
          title="Total schedule(s)"
          value={formatNumber(data.totalRows)}
          unit="all times"
        />
        <AnalyticCard
          title="Active schedule(s)"
          value={formatNumber(activeSchedules.length)}
          unit="Running now"
        />
        <AnalyticCard
          title="Upcoming schedule(s)"
          value={formatNumber(upcomingWithin24Hours.length)}
          unit="Next 24h"
        />
      </div>

      <TableToolbar
        summary={
          <div className="flex w-full items-center gap-1 rounded-lg border border-slate-400 bg-white p-1 md:w-auto">
            <button
              type="button"
              onClick={() => changeTab('active')}
              className={[
                'flex-1 rounded-md self-stretch text-sm font-medium transition-colors md:flex-none md:w-[150px] md:py-1.5',
                tab === 'active'
                  ? 'bg-emerald-500 text-emerald-50 shadow-[0px_1px_1px_rgba(0,0,0,0.03)]'
                  : 'bg-transparent text-slate-500',
              ].join(' ')}
            >
              Active schedule
            </button>

            <button
              type="button"
              onClick={() => changeTab('upcoming')}
              className={[
                'flex-1 rounded-md self-stretch text-sm font-medium transition-colors md:flex-none md:w-[150px] md:py-1.5',
                tab === 'upcoming'
                  ? 'bg-emerald-500 font-medium text-emerald-50 shadow-[0px_1px_1px_rgba(0,0,0,0.03)]'
                  : 'bg-transparent font-normal text-neutral-300',
              ].join(' ')}
            >
              Upcoming schedule
            </button>
          </div>
        }
        actions={
          <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="min-w-0 flex-1 md:flex-none">
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder="Search..."
                className="flex-1 md:flex-none"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              className="size-11 shrink-0 rounded-md md:size-8"
            >
              <CalendarDays className="size-4" />
            </Button>
          </div>
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

        {tabSchedules.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={search ? 'No matching schedule' : 'No schedule'}
            description={
              search
                ? `No schedules match "${search}". Try a different search term.`
                : tab === 'active'
                  ? 'There are no schedules running right now.'
                  : 'There are no upcoming schedules within the next 24 hours.'
            }
            action={
              !search && (
                <Button
                  onClick={() => setModalState({ open: true })}
                  className="w-[200px]"
                >
                  <Plus className="size-4" />
                  Add schedule
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
                      onCheckedChange={togglePageSelection}
                    />
                  </TableHead>

                  <SortableTableHead
                    sortKey="room"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={toggleSort}
                  >
                    Room
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
                    sortKey="deviceEui"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={toggleSort}
                  >
                    Device EUI
                  </SortableTableHead>

                  <SortableTableHead
                    sortKey="date"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={toggleSort}
                  >
                    Start Date
                  </SortableTableHead>

                  <SortableTableHead
                    sortKey="time"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={toggleSort}
                  >
                    Time
                  </SortableTableHead>

                  <SortableTableHead
                    sortKey="repeat"
                    activeKey={sortKey}
                    direction={direction}
                    onSort={toggleSort}
                  >
                    Repeat
                  </SortableTableHead>

                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {tabSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>{columns.checkbox(schedule)}</TableCell>
                    <TableCell>{columns.room(schedule)}</TableCell>
                    <TableCell>{columns.component(schedule)}</TableCell>
                    <TableCell>{columns.deviceEui(schedule)}</TableCell>
                    <TableCell>{columns.date(schedule)}</TableCell>
                    <TableCell>{columns.time(schedule)}</TableCell>
                    <TableCell>{columns.repeat(schedule)}</TableCell>
                    <TableCell>{columns.action(schedule)}</TableCell>
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

      <ScheduleFormModal
        open={modalState.open}
        schedule={modalState.schedule}
        rooms={rooms}
        devices={devices}
        onOpenChange={(open) => setModalState({ open })}
        onSuccess={handleSave}
      />

      <ScheduleDetailModal
        schedule={detailSchedule}
        onClose={() => setDetailSchedule(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Schedule"
        description={
          <>
            Are you sure you want to delete{' '}
            <span className="font-bold">&quot;this schedule&quot;</span>? This
            action cannot be undone.
          </>
        }
        confirming={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete All Schedule"
        count={selectedSchedules.length}
        itemLabel="schedule"
        confirmLabel="Yes, delete all schedule"
        confirming={bulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}
