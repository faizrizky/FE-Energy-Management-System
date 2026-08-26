'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { GatewayForm } from './form';
import { gatewaysClientApi } from '@/feat/gateway/api.client';
import type { GatewayFormValues } from '@/feat/gateway/schema';
import type { GatewayDTO } from '@/feat/gateway/dto';

interface GatewayFormModalProps {
  open: boolean;
  gateway?: GatewayDTO;
  onOpenChange: (open: boolean) => void;
  onSuccess: (gateway: GatewayDTO) => void;
}

export function GatewayFormModal({
  open,
  gateway,
  onOpenChange,
  onSuccess,
}: GatewayFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const defaultValues: Partial<GatewayFormValues> = gateway
    ? {
        name: gateway.name,
        eui: gateway.eui,
        simcard: gateway.simcard ?? '',
        installationDate: gateway.installationDate
          ? gateway.installationDate.slice(0, 10)
          : '',
        powerSource: gateway.powerSource ?? '',
        modelUnit: gateway.modelUnit ?? '',
        description: gateway.description ?? '',
      }
    : undefined;

  const handleSubmit = async (values: GatewayFormValues) => {
    setSubmitting(true);
    try {
      const saved = gateway
        ? await gatewaysClientApi.update(gateway.id, values)
        : await gatewaysClientApi.create(values);
      onSuccess(saved);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.5)] p-4">
      <div className="flex max-h-[90vh] w-full max-w-[500px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-emerald-500">
            {gateway ? 'Edit gateway' : 'Add gateway'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-md p-1 hover:bg-slate-100"
          >
            <X className="size-5 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          <GatewayForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}
