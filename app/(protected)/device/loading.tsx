import { Skeleton } from '@/components/ui/skeleton';

export default function DeviceLoading() {
  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-hidden bg-slate-50 p-8">
      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-[200px] rounded-lg" />
      </div>

      <div className="flex w-full gap-2.5">
        <Skeleton className="h-[140px] flex-1 rounded-xl" />
        <Skeleton className="h-[140px] flex-1 rounded-xl" />
        <Skeleton className="h-[140px] flex-1 rounded-xl" />
      </div>

      <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-8 w-[400px]" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
