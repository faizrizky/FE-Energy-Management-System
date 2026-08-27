'use client';

import { X } from 'lucide-react';
import type { RoleDTO } from '@/feat/role/dto';

interface RoleDetailDrawerProps {
  role: RoleDTO | null;
  onClose: () => void;
}

export function RoleDetailDrawer({ role, onClose }: RoleDetailDrawerProps) {
  if (!role) return null;

  const grouped = new Map<string, string[]>();
  for (const rp of role.permissions ?? []) {
    const list = grouped.get(rp.permission.module) ?? [];
    list.push(rp.permission.action);
    grouped.set(rp.permission.module, list);
  }
  const entries = Array.from(grouped.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[450px] flex-col border-l border-slate-300 bg-white p-6 shadow-[0px_8px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-emerald-500">
              {role.name}
            </h2>
            {role.description && (
              <p className="text-sm text-slate-500">{role.description}</p>
            )}
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

        <p className="mb-3 text-xs text-slate-600">
          Permissions ({role.permissions?.length ?? 0})
        </p>

        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">No permissions assigned.</p>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto">
            {entries.map(([module, actions]) => (
              <div
                key={module}
                className="rounded-xl border border-neutral-300 p-4 shadow-[0px_8px_12px_rgba(0,0,0,0.05)]"
              >
                <p className="mb-2 text-sm font-semibold capitalize text-emerald-700">
                  {module}
                </p>
                <div className="flex flex-wrap gap-1">
                  {actions.map((action) => (
                    <span
                      key={action}
                      className="rounded bg-emerald-100 px-2 py-1 text-xs capitalize text-emerald-700"
                    >
                      {action.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
