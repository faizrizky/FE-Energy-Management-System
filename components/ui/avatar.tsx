"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

/**
 * Avatar Radix bentuk kotak rounded.
 *
 * Dipake di: components/shared/header.tsx.
 */
export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-lg", className)}
    {...props}
  />
));
Avatar.displayName = "Avatar";

export const AvatarImage = AvatarPrimitive.Image;

/**
 * Isi avatar pas gambarnya nggak ada/gagal (biasanya inisial nama).
 *
 * Dipake di: components/shared/header.tsx.
 */
export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex size-full items-center justify-center bg-emerald-100 text-emerald-700", className)}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";
