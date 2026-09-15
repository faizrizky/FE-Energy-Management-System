'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/**
 * Isi dropdown menu (portal + styling).
 *
 * Dipake di: report/client.tsx (menu export), notification-bell.tsx.
 */
export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 flex flex-col items-center justify-center rounded-lg border border-slate-400 bg-white p-1 shadow-[0px_4px_6px_rgba(0,0,0,0.06)]',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

/**
 * Item dropdown menu; bisa warna merah buat aksi destructive.
 *
 * Dipake di: report/client.tsx (pilihan format export).
 */
export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    destructive?: boolean;
  }
>(({ className, destructive, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-semibold outline-none',
      destructive
        ? 'bg-red-700 text-emerald-50'
        : 'text-slate-950 hover:bg-slate-50',
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';
