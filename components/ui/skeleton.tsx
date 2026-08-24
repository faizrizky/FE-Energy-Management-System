import { cn } from "@/lib/utils";

/**
 * Base shimmer block. All feature-level skeletons (dashboard, rooms, ...)
 * compose this primitive instead of re-implementing the pulse animation.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/70", className)}
      {...props}
    />
  );
}
