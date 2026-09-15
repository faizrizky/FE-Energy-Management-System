export type ToastVariant =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading'
  | 'default';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
  dismissible: boolean;
  action?: ToastAction;
}

interface ToastOptions {
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;

  id?: string;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Kabarin semua listener kalo daftar toast berubah.
 *
 * Dipake di: upsert, dismiss (file ini).
 */
function emit() {
  listeners.forEach((listener) => listener(toasts));
}

/**
 * Bikin id toast unik.
 *
 * Dipake di: upsert (file ini).
 */
function genId() {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 5000,
  loading: Infinity,
  default: 4000,
};

/**
 * Default tombol dismiss: cuma muncul buat toast success & default.
 *
 * Dipake di: upsert (file ini).
 */
function defaultDismissible(variant: ToastVariant) {
  return variant === 'success' || variant === 'default';
}

/**
 * Tambah toast baru (paling atas) atau ganti toast dengan id yang sama, terus
 * atur timer biar hilang sendiri (loading nggak pernah hilang sendiri).
 *
 * Dipake di: Semua method toast.* (file ini).
 */
function upsert(
  variant: ToastVariant,
  title: string,
  options: ToastOptions = {}
): string {
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

/**
 * Hapus satu toast (kalo id-nya dikasih) atau semua toast, sekalian timernya.
 *
 * Dipake di: Timer di upsert, toast.dismiss (tombol di
 *   components/ui/toast.tsx).
 */
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

/**
 * Ambil pesan dari Error, atau pake teks cadangan.
 *
 * Dipake di: toast.promise (file ini).
 */
function extractErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export const toast = {
  /**
   * Toast sukses (4 detik, bisa di-dismiss).
   *
   * Dipake di: Halaman Device, Gateway, Role, Rooms, Room detail, Schedule,
   *   User, hooks/use-device-commands.ts.
   */
  success: (title: string, options?: ToastOptions) =>
    upsert('success', title, options),

  /**
   * Toast error (6 detik).
   *
   * Dipake di: Hampir semua halaman client, login, modal gateway,
   *   hooks/use-device-commands.ts, lib/axios.ts.
   */
  error: (title: string, options?: ToastOptions) =>
    upsert('error', title, options),

  /**
   * Toast warning (5 detik).
   *
   * Dipake di: lib/axios.ts (rate limit & refresh sesi).
   */
  warning: (title: string, options?: ToastOptions) =>
    upsert('warning', title, options),

  /**
   * Toast info (5 detik).
   *
   * Dipake di: device/client.tsx, rooms/client.tsx,
   *   rooms/detail/[roomId]/client.tsx.
   */
  info: (title: string, options?: ToastOptions) =>
    upsert('info', title, options),

  /**
   * Toast loading yang nggak hilang sendiri.
   *
   * Dipake di: Belom dipake langsung (toast.promise manggil upsert sendiri).
   */
  loading: (title: string, options?: ToastOptions) =>
    upsert('loading', title, options),

  /**
   * Toast polos tanpa ikon.
   *
   * Dipake di: Belom dipake.
   */
  message: (title: string, options?: ToastOptions) =>
    upsert('default', title, options),
  dismiss,

  /**
   * Toast buat proses async: loading dulu, terus diganti jadi success atau
   * error (error tetep dilempar ke pemanggil).
   *
   * Dipake di: Hapus data di halaman Device, Gateway, Role, Rooms, Room
   *   detail, Schedule, User.
   */
  promise: async <T>(
    promiseFn: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error?: string | ((err: unknown) => string);
    }
  ): Promise<T> => {
    const id = upsert('loading', messages.loading);
    try {
      const data = await promiseFn;
      const successTitle =
        typeof messages.success === 'function'
          ? messages.success(data)
          : messages.success;
      upsert('success', successTitle, { id });
      return data;
    } catch (err) {
      const errorTitle =
        typeof messages.error === 'function'
          ? messages.error(err)
          : (messages.error ??
            extractErrorMessage(err, 'Terjadi kesalahan, coba lagi.'));
      upsert('error', errorTitle, { id });
      throw err;
    }
  },
};

/**
 * Daftarin listener daftar toast (langsung dipanggil sekali) dan balikin
 * fungsi buat unsubscribe.
 *
 * Dipake di: components/ui/toaster.tsx.
 */
export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}
