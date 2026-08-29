'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { timeAgo } from '@/column/alarm';
import type { AlarmDTO } from '@/feat/alarm/dto';

interface NotificationBellProps {
  alarms: AlarmDTO[];
}

export function NotificationBell({ alarms }: NotificationBellProps) {
  const hasUnread = alarms.some((a) => a.status === 'ACTIVE_UNACK');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative" aria-label="Notifications">
          <Bell className="size-6 text-slate-600" />
          {hasUnread && (
            <span className="absolute right-0 top-0 size-2 rounded-full bg-red-500" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] max-w-[90vw] items-stretch gap-2 p-2"
      >
        {alarms.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-slate-500">
            No notifications
          </p>
        ) : (
          alarms.slice(0, 3).map((alarm) => {
            const unread = alarm.status === 'ACTIVE_UNACK';
            return (
              <div
                key={alarm.id}
                className={[
                  'flex w-full flex-col gap-1 rounded-lg border p-3 text-left',
                  unread
                    ? 'border-red-300 bg-red-50'
                    : 'border-emerald-300 bg-emerald-50',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={[
                      'text-sm font-semibold',
                      unread ? 'text-red-600' : 'text-emerald-600',
                    ].join(' ')}
                  >
                    {alarm.deviceName}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {timeAgo(alarm.createdTime)}
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  {alarm.type} in {alarm.roomName} —{' '}
                  {unread ? 'needs attention' : 'acknowledged'}
                </p>
              </div>
            );
          })
        )}

        <Link
          href="/alarm"
          className="mt-1 flex w-full items-center justify-center rounded-md py-2 text-sm font-medium text-slate-950 hover:bg-slate-50"
        >
          View all
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
