'use client';

import { Sidebar } from './sidebar';
import { Drawer } from '@/components/ui/drawer';
import { SidebarProvider, useSidebar } from './sidebar-context';

function MobileDrawer() {
  const { open, setOpen } = useSidebar();
  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      side="left"
      panelClassName="w-[250px] p-0"
    >
      <Sidebar onNavigate={() => setOpen(false)} />
    </Drawer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full items-start bg-white">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="lg:hidden">
          <MobileDrawer />
        </div>
        <div className="flex h-full min-w-0 flex-1 flex-col items-start overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
