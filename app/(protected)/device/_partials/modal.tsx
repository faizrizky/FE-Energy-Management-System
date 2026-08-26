'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { DeviceForm } from './form';
import { devicesClientApi } from '@/feat/device/api.client';

import type { DeviceFormValues } from '@/feat/device/schema';
import type { DeviceDTO } from '@/feat/device/dto';
import type { RoomListItemDTO } from '@/feat/rooms/dto';
import type { GatewayDTO } from '@/feat/gateway/dto';

interface DeviceFormModalProps {
  open: boolean;
  device?: DeviceDTO;
  rooms: RoomListItemDTO[];
  gateways: GatewayDTO[];
  onOpenChange: (open: boolean) => void;
  onSuccess: (device: DeviceDTO) => void;
}

export function DeviceFormModal({
  open,
  device,
  rooms,
  gateways,
  onOpenChange,
  onSuccess,
}: DeviceFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const defaultValues: Partial<DeviceFormValues> = {
    name: device?.name ?? '',
    eui: device?.eui ?? '',
    deviceType: device?.deviceType ?? '',
    roomId: device?.roomId ?? '',
    gatewayId: device?.gatewayId ?? '',
    tbDeviceId: device?.tbDeviceId ?? '',
    intervalMinutes: device?.intervalMinutes ?? 15,
  };

  const handleSubmit = async (values: DeviceFormValues) => {
    setSubmitting(true);

    try {
      const saved = device
        ? await devicesClientApi.update(device.id, values)
        : await devicesClientApi.create(values);

      onSuccess(saved);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-[rgba(10,10,10,0.5)]
        p-4
        backdrop-blur-[10px]
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onOpenChange(false);
        }
      }}
    >
      <div
        className="
          flex max-h-[90vh] w-full max-w-[550px]
          flex-col overflow-hidden
          rounded-xl
          border border-slate-300
          bg-white
          shadow-[0px_8px_12px_rgba(0,0,0,0.15)]
        "
      >
        <div
          className="
            flex items-center justify-between
            border-b border-slate-200
            px-6 py-5
          "
        >
          <h2 className="text-lg font-semibold text-emerald-500">
            {device ? 'Edit device' : 'Add device'}
          </h2>

          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="
              rounded-md p-1
              transition-colors
              hover:bg-slate-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <X className="size-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <DeviceForm
            rooms={rooms}
            gateways={gateways}
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
