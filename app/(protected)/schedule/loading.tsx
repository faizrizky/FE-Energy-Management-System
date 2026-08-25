import { Skeleton } from '@/components/ui/skeleton';

export default function ScheduleLoading() {
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

      <div className="flex w-full flex-col gap-4 rounded-xl border border-slate-400 bg-white p-6">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-8 w-[450px]" />
        </div>

        <Skeleton className="h-10 w-full" />

        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
