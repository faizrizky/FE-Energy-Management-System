import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-emerald-500 text-white hover:bg-emerald-700",
        outline: "border border-slate-400 bg-white text-slate-950 hover:bg-slate-50",
        ghost: "hover:bg-slate-50 text-slate-950",
        destructive: "border border-status-error text-status-error hover:bg-red-50",
        destructiveSolid: "bg-status-error text-white hover:bg-red-700",
      },
      size: {
        default: "h-10 px-4 py-2.5",
        sm: "h-8 px-3 text-xs",
        icon: "size-8 p-2",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
