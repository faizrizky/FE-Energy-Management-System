'use client';

import {
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  Router,
  Smartphone,
  Users,
  UserCog,
  FolderKanban,
  LogOut,
} from 'lucide-react';
import {
  SidebarNavItem,
  type NavItem,
} from '@/components/shared/sidebar-nav-item';
import { logoutAction } from '@/feat/auth/actions';

interface NavGroup {
  label: string;
  items: NavItem[];
  onClick?: () => void;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Platform management',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Schedule', href: '/schedule', icon: CalendarDays },
      { label: 'Rooms', href: '/rooms', icon: DoorOpen },
    ],
  },
  {
    label: 'Installation management',
    items: [
      { label: 'Gateway', href: '/gateway', icon: Router },
      { label: 'Device', href: '/device', icon: Smartphone },
    ],
  },
  {
    label: 'User management',
    items: [
      { label: 'User', href: '/user', icon: Users },
      { label: 'Role', href: '/role', icon: UserCog },
    ],
  },
  {
    label: 'Report management',
    items: [{ label: 'Report', href: '/report', icon: FolderKanban }],
  },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  return (
    <aside className="flex h-full w-[250px] shrink-0 flex-col justify-between overflow-hidden border-r border-emerald-200 bg-white p-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col p-2">
          <div className="flex flex-col p-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500">
              <LayoutDashboard className="size-4 text-white " />
            </div>
          </div>
          <div className="flex flex-col p-2">
            <p className="font-display text-2xl font-semibold leading-8 text-emerald-500">
              EMS
            </p>
            <p className="text-xs text-slate-600">Energy management system</p>
          </div>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1 p-2">
            <p className="px-2 text-xs text-slate-600 opacity-70">
              {group.label}
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  {...item}
                  onClick={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col p-2">
        <button
          onClick={() => logoutAction()}
          className="flex h-8 w-full items-center gap-2 rounded-md p-2 text-sm text-red-700 hover:bg-red-50"
        >
          <LogOut className="size-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
