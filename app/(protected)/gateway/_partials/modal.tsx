'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { GatewayForm } from './form';
import { gatewaysClientApi } from '@/feat/gateway/api.client';
import { toast } from '@/lib/toast-store';
import type { GatewayFormValues } from '@/feat/gateway/schema';
import type { GatewayDTO } from '@/feat/gateway/dto';
import type { UserSummaryDTO } from '@/feat/user/dto';

interface GatewayFormModalProps {
  open: boolean;
  gateway?: GatewayDTO;
  users: UserSummaryDTO[];
  onOpenChange: (open: boolean) => void;
  onSuccess: (gateway: GatewayDTO) => void;
}

export function GatewayFormModal({
  open,
  gateway,
  users,
  onOpenChange,
  onSuccess,
}: GatewayFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (values: GatewayFormValues) => {
    setSubmitting(true);
    try {
      const saved = gateway
        ? await gatewaysClientApi.update(gateway.id, values)
        : await gatewaysClientApi.create(values);
      onSuccess(saved);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gateway could not be saved'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto gap-4 rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-emerald-500">
            {gateway ? 'Edit gateway' : 'Add gateway'}
          </h2>
          <button aria-label="Close" onClick={() => onOpenChange(false)}>
            <X className="size-5 text-slate-500" />
          </button>
        </div>

        <GatewayForm
          users={users}
          defaultValues={
            gateway
              ? {
                  name: gateway.name,
                  eui: gateway.eui,
                  simcard: gateway.simcard ?? '',
                  installationDate: gateway.installationDate
                    ? gateway.installationDate.slice(0, 10)
                    : '',
                  powerSource: gateway.powerSource ?? '',
                  modelUnit: gateway.modelUnit ?? '',
                  installedById: gateway.installedById ?? '',
                  description: gateway.description ?? '',
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
