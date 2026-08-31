'use client';

import { Sidebar } from './sidebar';
import { SidebarProvider, useSidebar } from './sidebar-context';

function MobileDrawer() {
  const { open, setOpen } = useSidebar();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
      />
      <div className="relative">
        <Sidebar onNavigate={() => setOpen(false)} />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full items-start bg-white">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <MobileDrawer />
        <div className="flex h-full min-w-0 flex-1 flex-col items-start overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
