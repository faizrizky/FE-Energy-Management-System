"use client";

import { useEffect, useState } from "react";
import { subscribeToasts, type ToastItem } from "@/lib/toast-store";
import { Toast } from "./toast";

/**
 * Pasang sekali di app/layout.tsx (di luar/di dalam <body>, sejajar {children}).
 * Posisi: bottom-right, stack toast terbaru di atas.
 */
export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-end gap-2 px-4 sm:right-4 sm:left-auto">
      {toasts.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <Toast item={item} />
        </div>
      ))}
    </div>
  );
}
