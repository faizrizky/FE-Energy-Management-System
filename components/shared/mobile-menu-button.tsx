'use client';

import { Menu } from 'lucide-react';
import { useSidebar } from './sidebar-context';

export function MobileMenuButton() {
  const { setOpen } = useSidebar();
  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={() => setOpen(true)}
      className="flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-400 bg-slate-50 text-slate-700 lg:hidden"
    >
      <Menu className="size-4" />
    </button>
  );
}
