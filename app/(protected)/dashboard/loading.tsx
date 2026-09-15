import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loading yang tampil pas halaman /dashboard lagi dimuat.
 *
 * Dipake di: Otomatis sama Next.js (loading.tsx) buat route /dashboard.
 */
export default function DashboardLoading() {
  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-hidden bg-slate-50 p-8">
      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-8 w-[250px]" />
      </div>

      <div className="flex w-full gap-2.5">
        <Skeleton className="h-[170px] flex-1 rounded-xl" />
        <Skeleton className="h-[170px] flex-1 rounded-xl" />
        <Skeleton className="h-[170px] flex-1 rounded-xl" />
      </div>

      <Skeleton className="h-11 w-full rounded-lg" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
