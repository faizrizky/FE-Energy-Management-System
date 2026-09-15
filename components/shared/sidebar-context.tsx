'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

const SidebarContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

/**
 * Context yang nyimpen state buka/tutup sidebar mobile.
 *
 * Dipake di: components/shared/app-shell.tsx → AppShell.
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Hook buat ambil state sidebar. Lempar error kalo dipake di luar
 * SidebarProvider.
 *
 * Dipake di: app-shell.tsx → MobileDrawer, mobile-menu-button.tsx.
 */
export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
