import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-8 w-full rounded-md border border-slate-400 bg-white px-3 py-1 text-sm text-slate-950",
        "shadow-[0px_1px_1px_rgba(0,0,0,0.1)] placeholder:text-slate-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        "aria-[invalid=true]:border-status-error",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
