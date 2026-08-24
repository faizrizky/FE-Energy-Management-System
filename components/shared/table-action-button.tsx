import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableActionButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  tone?: "default" | "primary" | "destructive";
  disabled?: boolean;
  "aria-label": string;
}

/** Small square icon button used in table rows (eye / edit / trash / log). */
export function TableActionButton({
  icon: Icon,
  onClick,
  tone = "default",
  disabled,
  ...rest
}: TableActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-8 items-center justify-center rounded-md border transition-colors",
        tone === "default" && "border-slate-400 bg-white text-slate-950 hover:bg-slate-50",
        tone === "primary" && "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-700",
        tone === "destructive" && "border-status-error bg-white text-status-error hover:bg-red-100",
        disabled && "border-transparent bg-neutral-300 text-white"
      )}
      {...rest}
    >
      <Icon className="size-4" />
    </button>
  );
}
