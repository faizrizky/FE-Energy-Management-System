'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownUp, ArrowUpDown } from 'lucide-react';
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

/**
 * Wraps children in AnimatePresence so individual <TableRow> mount/unmount
 * (add, remove, filter, delete) animate. AnimatePresence itself renders no
 * DOM node - only its children (the actual <tr>s) end up under <tbody>, so
 * this stays valid table markup.
 */
export function TableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('bg-white', className)} {...props}>
      <AnimatePresence initial mode="sync">
        {children}
      </AnimatePresence>
    </tbody>
  );
}

/**
 * Fade-only row animation. Deliberately NOT using `layout`/transform here -
 * CSS transforms on <tr> are unreliable across browsers (table layout
 * engine handles them differently than block/flex elements). Opacity is
 * safe everywhere.
 *
 * Row identity is tracked via the `key` you already pass in `.map()` -
 * rows with the same key across re-renders (e.g. toggling a switch) will
 * NOT re-play the entrance animation, only genuinely new/removed rows do.
 *
 * Optional: pass `custom={index}` from your `.map()` for a staggered
 * cascade on first load (see rowVariants below).
 */
const rowVariants = {
  hidden: { opacity: 0 },
  visible: (index: number = 0) => ({
    opacity: 1,
    transition: { delay: Math.min(index, 20) * 0.03, duration: 0.18 },
  }),
};

export interface TableRowProps extends Omit<
  React.ComponentProps<typeof motion.tr>,
  'ref'
> {
  custom?: number;
}

export function TableRow({ className, custom, ...props }: TableRowProps) {
  return (
    <motion.tr
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      custom={custom}
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
        {isActive && direction === 'asc' && (
          <ArrowUpDown className="size-3.5" />
        )}
        {isActive && direction === 'desc' && (
          <ArrowDownUp className="size-3.5" />
        )}
        {!isActive && <ArrowDownUp className="size-3.5 opacity-40" />}
      </button>
    </TableHead>
  );
}
