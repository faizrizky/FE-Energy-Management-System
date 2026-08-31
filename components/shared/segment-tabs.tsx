'use client';

interface SegmentTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
}

export function SegmentTabs<T extends string>({
  value,
  onValueChange,
  options,
}: SegmentTabsProps<T>) {
  return (
    <div className="flex w-full flex-col gap-1 rounded-lg border border-slate-400 bg-white p-1 md:flex-row md:gap-2.5 md:border-0 md:bg-transparent md:p-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onValueChange(opt.value)}
          className={[
            'h-11 w-full rounded-md text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-emerald-500 text-white shadow-[0px_1px_1px_rgba(0,0,0,0.03)]'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 md:bg-slate-100',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
