'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.ComponentPropsWithoutRef<
  typeof SwitchPrimitive.Root
> {
  onLabel?: string;
  offLabel?: string;
}

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, checked, onLabel = 'On', offLabel = 'Off', ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    checked={checked}
    className={cn(
      'inline-flex h-6 items-center gap-1 rounded-full px-1 transition-colors',
      checked ? 'justify-end bg-emerald-700' : 'justify-start bg-red-700',
      className
    )}
    {...props}
  >
    {checked ? (
      <>
        <span className="text-sm font-medium text-emerald-50">{onLabel}</span>
        <SwitchPrimitive.Thumb className="block size-5 shrink-0 rounded-full bg-white shadow" />
      </>
    ) : (
      <>
        <SwitchPrimitive.Thumb className="block size-5 shrink-0 rounded-full bg-white shadow" />
        <span className="text-sm font-medium text-emerald-50">{offLabel}</span>
      </>
    )}
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';
