'use client';

import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, CalendarDays, Trash2 } from 'lucide-react';
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
import { getScheduleColumns } from '@/column/schedule';
import { scheduleClientApi } from '@/feat/schedule/api.client';
import type { ScheduleDTO, ScheduleListResponseDTO } from '@/feat/schedule/dto';
import type { RoomListItemDTO } from '@/feat/rooms/dto';
import type { DeviceDTO } from '@/feat/device/dto';
import { ScheduleFormModal } from './_partials/modal';
import { ScheduleDetailModal } from './_partials/detail-modal';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { useRealtimeEvent } from '@/hooks/use-realtime-event';

interface ScheduleClientProps {
  initialData: ScheduleListResponseDTO;
  initialOverallTotal: number;
  initialUpcomingTotal: number;
  rooms: RoomListItemDTO[];
  devices: DeviceDTO[];
}

const SEARCH_DEBOUNCE_MS = 250;

const SCHEDULE_SORT_ACCESSORS = {
  room: (s: ScheduleDTO) => s.room?.name ?? '',
  component: (s: ScheduleDTO) => s.device?.deviceType ?? '',
  deviceEui: (s: ScheduleDTO) => s.device?.eui ?? '',
  date: (s: ScheduleDTO) => new Date(s.scheduledDate).getTime(),
  time: (s: ScheduleDTO) => s.startTime,
  repeat: (s: ScheduleDTO) => s.repeatType,
};

type ScheduleTab = 'active' | 'upcoming';

function toApiDate(date: Date | undefined) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function ScheduleClient({
  initialData,
  initialOverallTotal,
  initialUpcomingTotal,
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
  const [isFetching, setIsFetching] = useState(false);
  const [tab, setTab] = useState<ScheduleTab>('active');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [overallTotal, setOverallTotal] = useState(initialOverallTotal);
  const [activeTotal, setActiveTotal] = useState(initialData.totalRows);
  const [upcomingTotal, setUpcomingTotal] = useState(initialUpcomingTotal);

  const [modalState, setModalState] = useState<{
    open: boolean;
    schedule?: ScheduleDTO;
  }>({ open: false });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSchedule, setDetailSchedule] = useState<ScheduleDTO | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadSchedulesRequestRef = useRef(0);

  const loadSchedules = async (
    nextPage: number,
    nextRowsPerPage: number,
    nextSearch: string,
    nextTab: ScheduleTab,
    nextRange: DateRange | undefined
  ) => {
    const requestId = ++loadSchedulesRequestRef.current;
    setIsFetching(true);
    try {
      const result = await scheduleClientApi.list({
        status: nextTab,
        page: nextPage,
        rowsPerPage: nextRowsPerPage,
        search: nextSearch,
        scheduledFrom: toApiDate(nextRange?.from),
        scheduledTo: toApiDate(nextRange?.to),
      });

      if (requestId !== loadSchedulesRequestRef.current) return;
      setData(result);
      if (nextTab === 'active') setActiveTotal(result.totalRows);
      else setUpcomingTotal(result.totalRows);
    } catch (err) {
      if (requestId !== loadSchedulesRequestRef.current) return;
      toast.error(
        err instanceof Error ? err.message : 'Failed to load schedules'
      );
    } finally {
      if (requestId === loadSchedulesRequestRef.current) setIsFetching(false);
    }
  };

  const refreshCounts = async () => {
    try {
      const [overall, upcoming] = await Promise.all([
        scheduleClientApi.list({ page: 1, rowsPerPage: 1 }),
        scheduleClientApi.list({ page: 1, rowsPerPage: 1, status: 'upcoming' }),
      ]);
      setOverallTotal(overall.totalRows);
      setUpcomingTotal(upcoming.totalRows);
      if (tab === 'upcoming') {
        const active = await scheduleClientApi.list({
          page: 1,
          rowsPerPage: 1,
          status: 'active',
        });
        setActiveTotal(active.totalRows);
      }
    } catch {}
  };

  useRealtimeEvent('schedule:created', () => {
    loadSchedules(1, rowsPerPage, search, tab, dateRange);
    refreshCounts();
  });
  useRealtimeEvent('schedule:updated', () => {
    loadSchedules(page, rowsPerPage, search, tab, dateRange);
    refreshCounts();
  });
  useRealtimeEvent('schedule:deleted', () => {
    loadSchedules(page, rowsPerPage, search, tab, dateRange);
    refreshCounts();
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadSchedules(1, rowsPerPage, value, tab, dateRange);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleDateRangeApply = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
    loadSchedules(1, rowsPerPage, search, tab, range);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    loadSchedules(nextPage, rowsPerPage, search, tab, dateRange);
  };

  const handleRowsPerPageChange = (nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
    loadSchedules(1, nextRowsPerPage, search, tab, dateRange);
  };

  const openScheduleDetail = async (schedule: ScheduleDTO) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailSchedule(null);

    try {
      const result = await scheduleClientApi.getById(schedule.id);
      setDetailSchedule(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load gateway detail'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeScheduleDetail = () => {
    setDetailOpen(false);
  };

  const columns = getScheduleColumns({
    isSelected: (id) => selected.has(id),
    onToggleSelect: (id) =>
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    onView: openScheduleDetail,
    onEdit: (schedule) => setModalState({ open: true, schedule }),
    onDelete: (schedule) => setDeleteTarget(schedule),
  });

  const { sorted, sortKey, direction, toggleSort } = useTableSort(
    data.data,
    SCHEDULE_SORT_ACCESSORS
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
    loadSchedules(1, rowsPerPage, search, nextTab, dateRange);
  };

  const handleSave = async () => {
    await loadSchedules(page, rowsPerPage, search, tab, dateRange);
    await refreshCounts();
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
      await loadSchedules(page, rowsPerPage, search, tab, dateRange);
      await refreshCounts();
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

      await loadSchedules(page, rowsPerPage, search, tab, dateRange);
      await refreshCounts();

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
          value={formatNumber(overallTotal)}
          unit="all times"
        />
        <AnalyticCard
          title="Active schedule(s)"
          value={formatNumber(activeTotal)}
          unit="Running now"
        />
        <AnalyticCard
          title="Upcoming schedule(s)"
          value={formatNumber(upcomingTotal)}
          unit="All upcoming"
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
                className="flex-1 md:flex-none"
              />
            </div>

            <DateRangeFilter value={dateRange} onApply={handleDateRangeApply} />
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

        <motion.div
          key={isFetching ? 'loading' : 'loaded'}
          initial={{ opacity: 0 }}
          animate={{ opacity: isFetching ? 0.4 : 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex w-full flex-col items-end gap-4"
        >
          {data.data.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={
                search || dateRange?.from
                  ? 'No matching schedule'
                  : 'No schedule'
              }
              description={
                search
                  ? `No schedules match "${search}". Try a different search term.`
                  : dateRange?.from
                    ? 'No schedules were scheduled in this date range.'
                    : tab === 'active'
                      ? 'There are no schedules running right now.'
                      : 'There are no upcoming schedules.'
              }
              action={
                !search &&
                !dateRange?.from && (
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
                  {sorted.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{columns.checkbox(schedule)}</TableCell>
                      <TableCell>{columns.schedule(schedule)}</TableCell>
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
        </motion.div>
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
        open={detailOpen}
        schedule={detailSchedule}
        onOpenChange={setDetailOpen}
        onClose={closeScheduleDetail}
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
