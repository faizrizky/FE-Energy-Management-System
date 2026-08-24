import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { getSession } from "@/lib/auth";

/**
 * Shared shell for every authenticated route: fixed 250px sidebar +
 * scrollable main area. Individual pages own their own <Header/> so they
 * can pass a route-specific breadcrumb.
 */
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen w-full items-start bg-white">
      <Sidebar />
      <div className="flex h-full min-w-0 flex-1 flex-col items-start overflow-hidden">
        {children}
      </div>
    </div>
  );
}
