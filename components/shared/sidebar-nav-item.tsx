'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function SidebarNavItem({ label, href, icon: Icon }: NavItem) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-md p-2 text-sm transition-colors',
        isActive
          ? 'bg-emerald-500 font-semibold text-emerald-50'
          : 'text-slate-950 hover:bg-slate-50'
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      <ChevronRight className="size-4 shrink-0 opacity-70" />
    </Link>
  );
}
