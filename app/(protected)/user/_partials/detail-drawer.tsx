'use client';

import { X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { UserDTO } from '@/feat/user/dto';

interface UserDetailDrawerProps {
  user: UserDTO | null;
  onClose: () => void;
}

export function UserDetailDrawer({ user, onClose }: UserDetailDrawerProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[450px] flex-col border-l border-slate-300 bg-white p-6 shadow-[0px_8px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-emerald-500">
              {user.fullName}
            </h2>
            <p className="text-sm text-slate-500">@{user.username}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="size-5 text-slate-500" />
          </button>
        </div>

        <div className="my-5 h-px bg-slate-200" />

        <div className="flex flex-col gap-3 rounded-xl border border-neutral-300 p-4 text-sm shadow-[0px_8px_12px_rgba(0,0,0,0.05)]">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Role" value={user.role?.name ?? '-'} />
          <InfoRow label="Phone" value={user.phone || '-'} />
          <InfoRow label="Address" value={user.address || '-'} />
          <InfoRow
            label="Last active"
            value={user.lastActiveAt ? formatDate(user.lastActiveAt) : 'Never'}
          />
          <InfoRow label="Created at" value={formatDate(user.createdAt)} />
        </div>
      </aside>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-medium text-neutral-500">{label}</span>
      <span className="text-right text-slate-950">{value}</span>
    </div>
  );
}
