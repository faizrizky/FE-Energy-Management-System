'use client';

import { useMemo, useState } from 'react';
import { BellRing } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
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
import { getAlarmColumns } from '@/column/alarm';
import { alarmClientApi } from '@/feat/alarm/api.client';
import type { AlarmDTO } from '@/feat/alarm/dto';

interface AlarmClientProps {
  initialData: AlarmDTO[];
}

type AlarmTab = 'unread' | 'all';

export function AlarmClient({ initialData }: AlarmClientProps) {
  const [alarms, setAlarms] = useState<AlarmDTO[]>(initialData ?? []);
  const [tab, setTab] = useState<AlarmTab>('unread');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(
    () =>
      tab === 'unread'
        ? alarms.filter((a) => a.status === 'ACTIVE_UNACK')
        : alarms,
    [alarms, tab]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * rowsPerPage,
    safePage * rowsPerPage
  );

  const columns = getAlarmColumns();

  const changeTab = (nextTab: AlarmTab) => {
    setTab(nextTab);
    setPage(1);
  };

  const handleAcknowledge = async (alarm: AlarmDTO) => {
    try {
      await alarmClientApi.acknowledge(alarm.id);
      setAlarms((prev) =>
        prev.map((a) =>
          a.id === alarm.id ? { ...a, status: 'ACTIVE_ACK' } : a
        )
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to acknowledge alarm'
      );
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-y-auto bg-slate-50 p-8">
      <PageHeader
        title="Notification"
        description="View, filter and manage alert logs, system warnings and device actions."
      />

      <div className="flex w-full flex-col items-end gap-4 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]">
        <div className="flex w-full items-center justify-between">
          <p className="text-lg font-semibold text-emerald-500">
            {formatNumber(filtered.length)} notification(s)
          </p>

          <div className="flex h-8 items-start gap-1 rounded-lg border border-slate-400 bg-white p-1">
            <button
              type="button"
              onClick={() => changeTab('unread')}
              className={[
                'flex h-6 w-[100px] shrink-0 items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium',
                tab === 'unread'
                  ? 'bg-emerald-500 text-emerald-50'
                  : 'bg-transparent text-slate-500',
              ].join(' ')}
            >
              Unread
            </button>
            <button
              type="button"
              onClick={() => changeTab('all')}
              className={[
                'flex h-6 w-[100px] shrink-0 items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium',
                tab === 'all'
                  ? 'bg-emerald-500 text-emerald-50'
                  : 'bg-transparent text-slate-500',
              ].join(' ')}
            >
              All
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title={
              tab === 'unread' ? 'No unread notifications' : 'No notifications'
            }
            description={
              tab === 'unread'
                ? "You're all caught up — nothing needs attention right now."
                : 'Notifications will show up here once devices report activity.'
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Device status</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((alarm) => (
                  <TableRow
                    key={alarm.id}
                    className={
                      alarm.status === 'ACTIVE_UNACK'
                        ? 'bg-red-50/60'
                        : 'bg-emerald-50/60'
                    }
                  >
                    <TableCell>{columns.date(alarm)}</TableCell>
                    <TableCell>{columns.subject(alarm)}</TableCell>
                    <TableCell>{columns.status(alarm)}</TableCell>
                    <TableCell>{columns.message(alarm)}</TableCell>
                    <TableCell>
                      {alarm.status === 'ACTIVE_UNACK' ? (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(alarm)}
                          className="rounded-md border border-slate-400 bg-white px-3 py-1.5 text-xs font-medium text-slate-950 hover:bg-slate-50"
                        >
                          Mark as read
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
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
