/**
 * Lightweight toast store — module-scoped, tidak butuh Context/Provider.
 * Bisa dipanggil dari mana saja: client component, event handler, bahkan
 * dari axios interceptor (lib/axios.ts) kalau nanti mau auto-toast error.
 *
 * API-nya sengaja mirip pola "sonner" (toast.success/error/promise) karena
 * `toast.promise` cocok dipasangkan langsung ke pemanggilan API kita yang
 * melempar `Error(message)` dari body backend (lihat lib/axios.ts & lib/http.ts).
 */

export type ToastVariant = "success" | "error" | "warning" | "info" | "loading" | "default";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number; // ms; Infinity = tidak auto-dismiss (dipakai untuk "loading")
  dismissible: boolean;
  action?: ToastAction;
}

interface ToastOptions {
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  /** Reuse id toast yang sudah ada — dipakai internal oleh toast.promise() untuk
   *  meng-upgrade toast "loading" jadi "success"/"error" tanpa toast baru muncul. */
  id?: string;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

function genId() {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Durasi default per varian — error/warning dikasih waktu lebih lama karena
// biasanya berisi pesan validasi dari backend yang perlu dibaca user.
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 5000,
  loading: Infinity,
  default: 4000,
};

// Sesuai Figma: toast sukses (create/update/delete) & toast "default" (plain)
// punya kontrol dismiss; status toast (error/warning/info) & loading tidak.
function defaultDismissible(variant: ToastVariant) {
  return variant === "success" || variant === "default";
}

function upsert(variant: ToastVariant, title: string, options: ToastOptions = {}): string {
  const id = options.id ?? genId();
  const duration = options.duration ?? DEFAULT_DURATION[variant];
  const dismissible = options.dismissible ?? defaultDismissible(variant);

  const next: ToastItem = {
    id,
    variant,
    title,
    description: options.description,
    duration,
    dismissible,
    action: options.action,
  };

  const existingIndex = toasts.findIndex((t) => t.id === id);
  toasts =
    existingIndex >= 0
      ? toasts.map((t, i) => (i === existingIndex ? next : t))
      : [next, ...toasts];

  emit();

  const existingTimer = timers.get(id);
  if (existingTimer) clearTimeout(existingTimer);

  if (Number.isFinite(duration)) {
    timers.set(
      id,
      setTimeout(() => dismiss(id), duration)
    );
  } else {
    timers.delete(id);
  }

  return id;
}

function dismiss(id?: string) {
  if (id) {
    const timer = timers.get(id);
    if (timer) clearTimeout(timer);
    timers.delete(id);
    toasts = toasts.filter((t) => t.id !== id);
  } else {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    toasts = [];
  }
  emit();
}

function extractErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export const toast = {
  success: (title: string, options?: ToastOptions) => upsert("success", title, options),
  error: (title: string, options?: ToastOptions) => upsert("error", title, options),
  warning: (title: string, options?: ToastOptions) => upsert("warning", title, options),
  info: (title: string, options?: ToastOptions) => upsert("info", title, options),
  loading: (title: string, options?: ToastOptions) => upsert("loading", title, options),
  message: (title: string, options?: ToastOptions) => upsert("default", title, options),
  dismiss,

  /**
   * Bungkus satu request API: tampilkan toast "loading", lalu upgrade jadi
   * "success" atau "error" begitu promise selesai — toast-nya SAMA (tidak
   * nambah baris baru), hanya ikon & warnanya berubah.
   *
   * `error` boleh diisi manual, tapi kalau tidak diisi kita pakai
   * `err.message` apa adanya — ini penting karena `lib/axios.ts` &
   * `lib/http.ts` sudah melempar Error() berisi persis field `message`
   * dari response backend (mis. "Jadwal bentrok dengan schedule lain...",
   * "Device belum terhubung ke ThingsBoard (tbDeviceId kosong)", dll).
   */
  promise: async <T,>(
    promiseFn: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error?: string | ((err: unknown) => string);
    }
  ): Promise<T> => {
    const id = upsert("loading", messages.loading);
    try {
      const data = await promiseFn;
      const successTitle =
        typeof messages.success === "function" ? messages.success(data) : messages.success;
      upsert("success", successTitle, { id });
      return data;
    } catch (err) {
      const errorTitle =
        typeof messages.error === "function"
          ? messages.error(err)
          : messages.error ?? extractErrorMessage(err, "Terjadi kesalahan, coba lagi.");
      upsert("error", errorTitle, { id });
      throw err;
    }
  },
};

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => listeners.delete(listener);
}
