import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TableToolbarProps {
  summary?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function TableToolbar({
  summary,
  actions,
  children,
  className,
}: TableToolbarProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-end gap-4 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_1px_1px_rgba(0,0,0,0.04)]',
        className
      )}
    >
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {summary}

        {actions && (
          <div className="flex w-full items-center gap-2 md:w-auto">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
