"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  onLabel?: string;
  offLabel?: string;
}

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, checked, onLabel = "On", offLabel = "Off", ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    checked={checked}
    className={cn(
      "inline-flex h-6 items-center gap-1 rounded-full px-0.5 transition-colors",
      checked ? "justify-end bg-emerald-700 pl-2" : "justify-start bg-red-700 pr-2",
      className
    )}
    {...props}
  >
    <span className="text-sm text-emerald-50">{checked ? onLabel : offLabel}</span>
    <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-white shadow" />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
