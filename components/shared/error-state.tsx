import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
}

/**
 * Tampilan error satu layar penuh dengan tombol link (actionHref) atau tombol
 * aksi (onAction).
 *
 * Dipake di: app/(protected)/layout.tsx, app/error.tsx, app/maintenance,
 *   app/not-found.tsx, app/unauthorized.
 */
export function ErrorState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-slate-50 px-4 py-20">
      <div className="flex size-10 items-center justify-center rounded-md border border-status-error bg-white">
        <XCircle className="size-5 text-status-error" />
      </div>
      <div className="flex max-w-[420px] flex-col items-center gap-1 text-center">
        <p className="text-lg font-semibold text-status-error">{title}</p>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {actionHref ? (
        <Button asChild className="w-[220px]">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : (
        <Button onClick={onAction} className="w-[220px]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
