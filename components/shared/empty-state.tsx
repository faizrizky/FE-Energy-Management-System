import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 py-10">
      <div className="flex size-8 items-center justify-center rounded-md border border-emerald-500 bg-white">
        <Icon className="size-4 text-emerald-500" />
      </div>
      <div className="flex max-w-[400px] flex-col items-center gap-2 text-center">
        <p className="text-lg font-semibold text-slate-950">{title}</p>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}