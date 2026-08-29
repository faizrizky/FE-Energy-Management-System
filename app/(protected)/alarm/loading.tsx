import { Skeleton } from '@/components/ui/skeleton';

export default function AlarmLoading() {
  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-hidden bg-slate-50 p-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-5 w-96" />
      </div>

      <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-8 w-[200px]" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
