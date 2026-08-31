'use client';

import { useMemo, useState } from 'react';
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

interface ReportClientProps {
  summary: DashboardSummaryDTO;
  timeline: EnergyUsageTimelineDTO;
  rows: ReportDeviceRowDTO[];
  range: ReportExportParams;
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
  rows,
  range,
}: ReportClientProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [exporting, setExporting] = useState<null | 'csv' | 'xlsx' | 'pdf'>(
    null
  );

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      [row.deviceEui, row.deviceName, row.roomName].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [rows, search]);

  const { sorted, sortKey, direction, toggleSort } = useTableSort(filtered, {
    deviceEui: (r) => r.deviceEui,
    room: (r) => r.roomName,
    usage: (r) => r.usageKwh,
  });

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
              <Button disabled={!!exporting} className="w-[170px]">
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

      <div className="flex w-full items-stretch gap-2.5">
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
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-semibold text-emerald-500">
            {formatNumber(filtered.length)} report(s)
          </p>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search by device, room..."
          />
        </div>

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
      </div>
    </div>
  );
}
