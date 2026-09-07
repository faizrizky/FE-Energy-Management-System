'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  side?: 'left' | 'right';
}

export function Drawer({
  open,
  onClose,
  children,
  panelClassName,
  side = 'right',
}: DrawerProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[5px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-0 z-40 flex h-full w-full flex-col overflow-hidden bg-white p-6 shadow-[0px_8px_12px_rgba(0,0,0,0.05)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out',
            side === 'right'
              ? 'right-0 border-l border-slate-300 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
              : 'left-0 border-r border-slate-300 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
            panelClassName
          )}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
