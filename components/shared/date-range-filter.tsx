'use client';

import { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

interface DateRangeFilterProps {
  value?: DateRange;
  onApply: (range: DateRange | undefined) => void;
}

export function DateRangeFilter({ value, onApply }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(value);
  const [month, setMonth] = useState<Date>(value?.from ?? new Date());

  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(value);
          setMonth(value?.from ?? new Date());
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex size-11 shrink-0 items-center justify-center rounded-md border border-slate-400 bg-white md:size-8"
        >
          <CalendarDays className="size-4 text-slate-600" />
          {value?.from && (
            <span className="absolute -right-1 -top-1 size-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto">
        <div className="flex flex-col gap-3">
          <Calendar
            mode="range"
            numberOfMonths={isDesktop ? 2 : 1}
            month={month}
            onMonthChange={setMonth}
            selected={draft}
            onSelect={(range) => setDraft(range)}
          />

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(undefined);
                setMonth(new Date());
                onApply(undefined);
                setOpen(false);
              }}
            >
              <X className="size-3.5" /> Clear
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!draft?.from}
              onClick={() => {
                onApply(draft);
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
