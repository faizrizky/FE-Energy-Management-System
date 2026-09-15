import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { subscribeToasts, toast, type ToastItem } from '@/lib/toast-store';

let snapshot: ToastItem[] = [];
let unsubscribe: () => void;

beforeEach(() => {
  vi.useFakeTimers();
  toast.dismiss();
  unsubscribe = subscribeToasts((items) => {
    snapshot = items;
  });
});

afterEach(() => {
  unsubscribe();
  toast.dismiss();
  vi.useRealTimers();
});

describe('toast variants', () => {
  test('[positive] toast baru ditaruh paling atas dengan default per varian', () => {
    toast.success('Tersimpan');
    toast.error('Gagal', { description: 'detail' });

    expect(snapshot.map((t) => t.title)).toEqual(['Gagal', 'Tersimpan']);
    expect(snapshot[0]).toMatchObject({ variant: 'error', duration: 6000, dismissible: false, description: 'detail' });
    expect(snapshot[1]).toMatchObject({ variant: 'success', duration: 4000, dismissible: true });
  });

  test.each([
    ['warning', 5000, false],
    ['info', 5000, false],
    ['message', 4000, true],
  ] as const)('[positive] %s -> durasi %i, dismissible %s', (method, duration, dismissible) => {
    toast[method]('Hai');
    expect(snapshot[0]).toMatchObject({ duration, dismissible });
  });

  test('[positive] toast hilang otomatis setelah durasi habis', () => {
    toast.success('Sebentar');
    vi.advanceTimersByTime(3999);
    expect(snapshot).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(snapshot).toHaveLength(0);
  });

  test('[positive] loading tidak pernah hilang otomatis', () => {
    toast.loading('Memproses');
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0].duration).toBe(Infinity);
  });

  test('[positive] id sama -> toast diganti di tempat & timer lama dibatalkan', () => {
    toast.loading('Memproses', { id: 'job' });
    toast.success('Selesai', { id: 'job', duration: 1000 });
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toMatchObject({ id: 'job', variant: 'success', title: 'Selesai' });
    vi.advanceTimersByTime(1000);
    expect(snapshot).toHaveLength(0);
  });

  test('[positive] opsi custom menimpa default & id unik dikembalikan', () => {
    const onClick = vi.fn();
    const id = toast.error('Err', { duration: 10, dismissible: true, action: { label: 'Retry', onClick } });
    expect(id).toMatch(/^toast_/);
    expect(snapshot[0]).toMatchObject({ duration: 10, dismissible: true, action: { label: 'Retry' } });
    expect(toast.info('x')).not.toBe(id);
  });
});

describe('dismiss', () => {
  test('[positive] dismiss id tertentu hanya menghapus toast itu', () => {
    const a = toast.info('A');
    toast.info('B');
    toast.dismiss(a);
    expect(snapshot.map((t) => t.title)).toEqual(['B']);
  });

  test('[positive] dismiss tanpa id menghapus semua & membatalkan semua timer', () => {
    toast.info('A');
    toast.info('B');
    toast.dismiss();
    expect(snapshot).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  test('[negative] dismiss id tidak dikenal tidak mengubah apa pun', () => {
    toast.info('A');
    toast.dismiss('tidak-ada');
    expect(snapshot).toHaveLength(1);
  });
});

describe('toast.promise', () => {
  test('[positive] sukses -> loading berubah jadi success dengan id sama', async () => {
    const result = await toast.promise(Promise.resolve(5), {
      loading: 'Menghapus',
      success: (n) => `Terhapus ${n}`,
    });
    expect(result).toBe(5);
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toMatchObject({ variant: 'success', title: 'Terhapus 5' });
  });

  test('[negative] gagal tanpa pesan error -> pakai message Error & tetap throw', async () => {
    await expect(
      toast.promise(Promise.reject(new Error('Device masih dipakai')), {
        loading: 'Menghapus',
        success: 'OK',
      })
    ).rejects.toThrow('Device masih dipakai');
    expect(snapshot[0]).toMatchObject({ variant: 'error', title: 'Device masih dipakai' });
  });

  test('[negative] gagal dengan error non-Error -> pesan fallback', async () => {
    await expect(toast.promise(Promise.reject('oops'), { loading: 'L', success: 'S' })).rejects.toBe('oops');
    expect(snapshot[0].title).toBe('Terjadi kesalahan, coba lagi.');
  });

  test('[negative] gagal dengan pesan error custom (string & function)', async () => {
    await expect(toast.promise(Promise.reject(new Error('x')), { loading: 'L', success: 'S', error: 'Custom' })).rejects.toThrow();
    expect(snapshot[0].title).toBe('Custom');
    await expect(
      toast.promise(Promise.reject(new Error('y')), { loading: 'L', success: 'S', error: (e) => `Err: ${(e as Error).message}` })
    ).rejects.toThrow();
    expect(snapshot[0].title).toBe('Err: y');
  });
});

describe('subscribeToasts', () => {
  test('[positive] listener langsung menerima state saat subscribe & berhenti setelah unsubscribe', () => {
    toast.info('Awal');
    const listener = vi.fn();
    const off = subscribeToasts(listener);
    expect(listener).toHaveBeenCalledWith([expect.objectContaining({ title: 'Awal' })]);
    off();
    toast.info('Setelah');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
