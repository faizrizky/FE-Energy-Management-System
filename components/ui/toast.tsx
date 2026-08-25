import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, type ToastItem, type ToastVariant } from "@/lib/toast-store";

/**
 * Ikon per varian — dipetakan dari Figma:
 *  - success -> check-circle (hijau)   node 52:165740
 *  - error   -> x-circle (merah)       node 52:165761
 *  - warning -> alert-triangle (amber) node 52:165746
 *  - info    -> info (biru)            node 52:165734
 *  - loading -> loader-pinwheel (spin) node 52:165782
 * Dipakai lucide-react (sudah jadi dependency proyek) alih-alih SVG asset
 * Figma, biar konsisten sama icon set yang sudah dipakai di seluruh app.
 */
const VARIANT_ICON: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />,
  error: <XCircle className="size-5 shrink-0 text-status-error" />,
  warning: <AlertTriangle className="size-5 shrink-0 text-amber-500" />,
  info: <Info className="size-5 shrink-0 text-blue-500" />,
  loading: <Loader2 className="size-5 shrink-0 animate-spin text-slate-500" />,
  default: null,
};

export function Toast({ item }: { item: ToastItem }) {
  const isPlain = item.variant === "default";

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-[360px] max-w-[calc(100vw-2rem)] items-center gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-[0px_1px_1.5px_rgba(0,0,0,0.08)]"
    >
      {VARIANT_ICON[item.variant]}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm text-slate-950">{item.title}</p>
        {item.description && (
          <p className="line-clamp-2 text-xs text-slate-500">{item.description}</p>
        )}
      </div>

      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            toast.dismiss(item.id);
          }}
          className="h-7 shrink-0 rounded-md px-4 text-sm font-medium text-slate-950 hover:bg-slate-50"
        >
          {item.action.label}
        </button>
      )}

      {item.dismissible && (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => toast.dismiss(item.id)}
          className={cn(
            "shrink-0 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-50",
            isPlain ? "flex size-5 items-center justify-center" : "h-7 px-4"
          )}
        >
          {isPlain ? <XCircle className="size-3.5" /> : "Dismiss"}
        </button>
      )}
    </div>
  );
}
