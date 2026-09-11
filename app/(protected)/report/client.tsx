'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { DateRange } from 'react-day-picker';
import {
  Download,
  FolderKanban,
  ChevronDown,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/page-header';
import { AnalyticCard } from '@/components/shared/analytic-card';
import { SearchInput } from '@/components/shared/search-input';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
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
import { formatKwh, formatNumber } from '@/lib/utils';
import { useTableSort } from '@/lib/use-table-sort';
import { getReportColumns } from '@/column/report';
import { reportClientApi } from '@/feat/report/api.client';
import type { ReportDeviceRowDTO, ReportExportParams } from '@/feat/report/dto';
import type {
  DashboardSummaryDTO,
  EnergyUsageTimelineDTO,
} from '@/feat/dashboard/dto';
import { useRealtimeEvent } from '@/hooks/use-realtime-event';

interface ReportClientProps {
  summary: DashboardSummaryDTO;
  timeline: EnergyUsageTimelineDTO;
  rows: ReportDeviceRowDTO[];
  range: ReportExportParams;
}

const REPORT_SORT_ACCESSORS = {
  deviceEui: (r: ReportDeviceRowDTO) => r.deviceEui,
  room: (r: ReportDeviceRowDTO) => r.roomName,
  usage: (r: ReportDeviceRowDTO) => r.usageKwh,
};

const LIVE_REFRESH_DEBOUNCE_MS = 5000;

function toApiDate(date: Date | undefined) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportClient({
  summary,
  timeline,
  rows: initialRows,
  range: initialRange,
}: ReportClientProps) {
  const [rows, setRows] = useState(initialRows);
  const [range, setRange] = useState(initialRange);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isFetching, setIsFetching] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [exporting, setExporting] = useState<null | 'csv' | 'xlsx' | 'pdf'>(
    null
  );

  const loadReportRequestRef = useRef(0);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const loadReport = useCallback(
    async (nextRange: ReportExportParams, { silent = false } = {}) => {
      const requestId = ++loadReportRequestRef.current;
      if (!silent) setIsFetching(true);
      try {
        const result = await reportClientApi.getSummary(nextRange);
        if (requestId !== loadReportRequestRef.current) return;
        setRows(result);
        setRange(nextRange);
        if (!silent) setPage(1);
      } catch (err) {
        if (requestId !== loadReportRequestRef.current) return;
        if (!silent) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to load report'
          );
        }
      } finally {
        if (requestId === loadReportRequestRef.current && !silent) {
          setIsFetching(false);
        }
      }
    },
    []
  );

  const handleDateRangeApply = (nextDateRange: DateRange | undefined) => {
    setDateRange(nextDateRange);
    if (!nextDateRange?.from) return;
    const from = toApiDate(nextDateRange.from) ?? range.from;
    const to = toApiDate(nextDateRange.to ?? nextDateRange.from) ?? range.to;
    loadReport({ from, to });
  };

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      [row.deviceEui, row.deviceName, row.roomName].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [rows, search]);

  // Data energi baru masuk lewat webhook device -> auto refresh rows buat
  // range yang lagi ditampilkan, silent (no spinner/toast). Di-debounce
  // karena webhook bisa nembak tiap beberapa detik per device yang nyala.
  const liveRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  useRealtimeEvent('device:status', () => {
    if (liveRefreshTimeoutRef.current) {
      clearTimeout(liveRefreshTimeoutRef.current);
    }
    liveRefreshTimeoutRef.current = setTimeout(() => {
      loadReport(rangeRef.current, { silent: true });
    }, LIVE_REFRESH_DEBOUNCE_MS);
  });

  const { sorted, sortKey, direction, toggleSort } = useTableSort(
    filtered,
    REPORT_SORT_ACCESSORS
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const columns = getReportColumns();

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(format);
    try {
      const blob = await reportClientApi.export(range, format);
      downloadBlob(
        blob,
        `energy-report-${range.from}_to_${range.to}.${format}`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to export report'
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Reports"
        description="View, analyze, and export energy and operational reports across all managed facilities."
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={!!exporting} className="w-full md:w-[200px]">
                <Download className="size-4" />
                {exporting ? 'Exporting...' : 'Export'}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[160px] items-stretch"
            >
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="size-4" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                <FileSpreadsheet className="size-4" /> Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="size-4" /> Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="grid w-full grid-cols-1 gap-2.5 md:grid-cols-3">
        <AnalyticCard
          title="Energy usage"
          value={formatKwh(summary.energyUsage.totalKwh, 1).replace(' kWh', '')}
          unit="kWh"
          helperText={`${summary.energyUsage.changePercentFromYesterday >= 0 ? '+' : ''}${summary.energyUsage.changePercentFromYesterday}% from yesterday`}
        />
        <AnalyticCard
          title="Peak usage"
          value={formatKwh(timeline.peak, 1).replace(' kWh', '')}
          unit="kWh"
        />
        <AnalyticCard
          title="Avg usage"
          value={formatKwh(timeline.average, 1).replace(' kWh', '')}
          unit="kWh"
        />
      </div>

      <div className="flex w-full flex-col items-end gap-4 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-lg font-semibold text-emerald-500">
            {formatNumber(filtered.length)} report(s)
          </p>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="min-w-0 flex-1 md:flex-none">
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Search by device, room..."
              />
            </div>
            <DateRangeFilter value={dateRange} onApply={handleDateRangeApply} />
          </div>
        </div>

        <motion.div
          key={isFetching ? 'loading' : 'loaded'}
          initial={{ opacity: 0 }}
          animate={{ opacity: isFetching ? 0.4 : 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex w-full flex-col items-end gap-4"
        >
          {sorted.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title={search ? 'No matching reports' : 'No reports yet'}
              description={
                search
                  ? `No reports match "${search}". Try a different search term.`
                  : 'Reports will appear once devices start sending readings.'
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      sortKey="deviceEui"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Device EUI
                    </SortableTableHead>
                    <SortableTableHead
                      sortKey="room"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Room
                    </SortableTableHead>
                    <TableHead>Date range</TableHead>
                    <TableHead>Start (kWh)</TableHead>
                    <TableHead>End (kWh)</TableHead>
                    <SortableTableHead
                      sortKey="usage"
                      activeKey={sortKey}
                      direction={direction}
                      onSort={toggleSort}
                    >
                      Usage (kWh)
                    </SortableTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>{columns.device(row)}</TableCell>
                      <TableCell>{columns.room(row)}</TableCell>
                      <TableCell>{columns.dateRange(row)}</TableCell>
                      <TableCell>{columns.start(row)}</TableCell>
                      <TableCell>{columns.end(row)}</TableCell>
                      <TableCell>{columns.usage(row)}</TableCell>
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
        </motion.div>
      </div>
    </div>
  );
}
