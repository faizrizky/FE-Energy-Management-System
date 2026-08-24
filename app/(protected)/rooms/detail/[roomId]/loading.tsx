import { Skeleton } from "@/components/ui/skeleton";

export default function RoomDetailLoading() {
  return (
    <div className="flex w-full flex-1 flex-col items-start gap-8 overflow-hidden bg-slate-50 p-8">
      <div className="flex w-full items-start gap-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-11 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="flex w-full gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] flex-1 rounded-xl" />
        ))}
      </div>

      <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-8 w-[400px]" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
