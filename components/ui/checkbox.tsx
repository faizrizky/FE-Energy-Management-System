"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "flex size-4 items-center justify-center rounded-[3px] border border-slate-300 bg-white",
      "data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-100",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator>
      <Check className="size-3 text-emerald-700" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";
