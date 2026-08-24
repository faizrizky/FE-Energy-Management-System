import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Green display title + slate description used at the top of every page. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex w-full items-end justify-between", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[36px] font-bold leading-[44px] tracking-[-0.72px] text-emerald-500">
          {title}
        </h1>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
