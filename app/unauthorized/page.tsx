import { ErrorState } from '@/components/shared/error-state';

/**
 * Halaman akses ditolak dengan tombol ke login.
 *
 * Dipake di: Route /unauthorized. Belom ada kode yang ngarahin ke sini.
 */
export default function UnauthorizedPage() {
  return (
    <ErrorState
      title="Access Denied"
      description="You do not have permission to access this page or meeting room."
      actionLabel="Login"
      actionHref="/login"
    />
  );
}
