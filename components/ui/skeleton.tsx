import { cn } from "@/lib/utils";

/**
 * Blok abu-abu berkedip buat placeholder loading.
 *
 * Dipake di: Semua loading.tsx, DeviceLogModal.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/70", className)}
      {...props}
    />
  );
}
