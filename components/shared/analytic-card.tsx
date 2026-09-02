import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { StatusDot } from './status-dot';

interface AnalyticCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  breakdown?: { label: string; tone: 'success' | 'error' }[];
  tone?: 'emerald' | 'red';
  helperText?: ReactNode;
  className?: string;
}

/**
 * The stat card used across Dashboard and Rooms
 * ("Energy usage", "Gateway(s)", "Total room(s)", "Peak usage", ...).
 */
export function AnalyticCard({
  title,
  value,
  unit,
  icon: Icon,
  breakdown,
  tone = 'emerald',
  helperText,
  className,
}: AnalyticCardProps) {
  const toneClass = tone === 'red' ? 'text-status-error' : 'text-emerald-500';

  return (
    <Card
      className={cn(
        'flex flex-1 flex-col justify-between gap-4 p-6',
        className
      )}
    >
      <div className="flex w-full items-center justify-between">
        <p className={cn('text-lg font-semibold', toneClass)}>{title}</p>
        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-md border border-slate-400 bg-slate-50">
            <Icon className="size-4 text-slate-600" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'font-display text-[30px] font-semibold leading-[38px]',
              toneClass
            )}
          >
            {value}
          </span>
          {unit && <span className="text-lg text-[#444651]">{unit}</span>}
        </div>

        {breakdown && breakdown.length > 0 && (
          <div className="flex gap-3">
            {breakdown.map((item) => (
              <StatusDot key={item.label} label={item.label} tone={item.tone} />
            ))}
          </div>
        )}

        {helperText && (
          <p className="text-xs text-status-error">{helperText}</p>
        )}
      </div>
    </Card>
  );
}
