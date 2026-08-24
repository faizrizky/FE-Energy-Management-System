import { Bell } from "lucide-react";
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SessionUser } from "@/lib/auth";

interface HeaderProps {
  breadcrumb: string[];
  user: SessionUser;
}

/** Top app bar: breadcrumb on the left, notifications + account on the right. */
export function Header({ breadcrumb, user }: HeaderProps) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-emerald-100 bg-white/95 px-8 backdrop-blur-md">
      <BreadcrumbNav items={["EMS", ...breadcrumb]} />

      <div className="flex items-center gap-3 py-4">
        <button aria-label="Notifications" className="relative">
          <Bell className="size-6 text-slate-600" />
        </button>
        <div className="h-6 w-px bg-slate-200" />
        <div className="flex items-center gap-2 p-2">
          <Avatar>
            <AvatarImage src="/avatar-placeholder.png" alt={user.name} />
            <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col whitespace-nowrap text-sm">
            <span className="text-emerald-500">{user.name}</span>
            <span className="text-xs text-slate-600">{user.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
