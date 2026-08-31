'use client';

import type { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  count?: number;
  itemLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  count,
  itemLabel = 'item',
  confirmLabel,
  cancelLabel = 'No, cancel',
  confirming,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const resolvedDescription =
    description ??
    (count !== undefined ? (
      <>
        Are you sure you want to delete{' '}
        <span className="font-bold">
          {count} selected {itemLabel}
          {count === 1 ? '' : 's'}
        </span>
        ? This action cannot be undone.
      </>
    ) : null);

  const resolvedConfirmLabel =
    confirmLabel ??
    (count && count > 1 ? `Yes, Delete (${count})` : 'Yes, Delete');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.5)] p-4 backdrop-blur-[5px]">
      <div className="flex w-full max-w-[400px] flex-col gap-6 rounded-xl border border-slate-400 bg-white p-6 shadow-[0px_8px_12px_rgba(0,0,0,0.15)]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-8 items-center justify-center rounded-md border border-status-error bg-white">
            <Trash2 className="size-4 text-status-error" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-lg font-semibold text-status-error">{title}</p>
            <p className="text-sm text-slate-600">{resolvedDescription}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={confirming}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructiveSolid"
            className="flex-1"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'Deleting...' : resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
