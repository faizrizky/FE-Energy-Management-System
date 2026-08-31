import * as React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export function Table({ className, wrapperClassName, ...props }: TableProps) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-lg border border-slate-200',
        wrapperClassName
      )}
    >
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader(
  props: React.HTMLAttributes<HTMLTableSectionElement>
) {
  return <thead className="bg-slate-50" {...props} />;
}

export function TableBody(
  props: React.HTMLAttributes<HTMLTableSectionElement>
) {
  return <tbody className="bg-white" {...props} />;
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('h-12 border-b border-slate-200', className)}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left text-sm font-medium text-slate-500',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 text-xs text-neutral-950', className)} {...props} />
  );
}

export interface SortableTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string;
  activeKey: string | null;
  direction: 'asc' | 'desc';
  onSort: (key: string) => void;
}

export function SortableTableHead({
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
  children,
  ...props
}: SortableTableHeadProps) {
  const isActive = activeKey === sortKey;
  return (
    <TableHead className={cn('select-none', className)} {...props}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 hover:text-emerald-600"
      >
        {children}
        {isActive && direction === 'asc' && <ChevronUp className="size-3.5" />}
        {isActive && direction === 'desc' && (
          <ChevronDown className="size-3.5" />
        )}
        {!isActive && <ChevronsUpDown className="size-3.5 opacity-40" />}
      </button>
    </TableHead>
  );
}
