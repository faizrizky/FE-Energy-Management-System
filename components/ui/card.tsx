import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Container kartu dengan border & bayangan tipis.
 *
 * Dipake di: dashboard/_partials (active-schedules, energy-usage-timeline,
 *   top-risky-rooms), analytic-card.tsx.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-400 bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.04)]",
        className
      )}
      {...props}
    />
  );
}

/**
 * Header kartu (flex kiri-kanan).
 *
 * Dipake di: Belom dipake.
 */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between", className)} {...props} />;
}

/**
 * Judul kartu warna hijau.
 *
 * Dipake di: Belom dipake.
 */
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-lg font-semibold text-emerald-500", className)} {...props} />;
}
