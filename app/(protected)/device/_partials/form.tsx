'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { deviceFormSchema, type DeviceFormValues } from '@/feat/device/schema';
import type { RoomListItemDTO } from '@/feat/rooms/dto';
import type { GatewayDTO } from '@/feat/gateway/dto';

interface DeviceFormProps {
  rooms: RoomListItemDTO[];
  gateways: GatewayDTO[];
  defaultValues?: Partial<DeviceFormValues>;
  onSubmit: (values: DeviceFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

export function DeviceForm({
  rooms,
  gateways,
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}: DeviceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: '',
      eui: '',
      deviceType: '',
      roomId: '',
      gatewayId: '',
      tbDeviceId: '',
      intervalMinutes: 15,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Device name" error={errors.name?.message}>
        <Input
          placeholder="e.g. AC Command Center"
          {...register('name')}
          aria-invalid={!!errors.name}
        />
      </Field>

      <Field label="Device EUI" error={errors.eui?.message}>
        <Input
          placeholder="e.g. DEV-0001"
          {...register('eui')}
          aria-invalid={!!errors.eui}
        />
      </Field>

      <Field label="Component type" error={errors.deviceType?.message}>
        <Input
          placeholder="e.g. AC, Lampu, Stopkontak"
          {...register('deviceType')}
          aria-invalid={!!errors.deviceType}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Room" error={errors.roomId?.message}>
          <select
            {...register('roomId')}
            className="h-8 w-full rounded-md border border-slate-400 bg-white px-3 text-sm text-slate-950 outline-none"
          >
            <option value="">Choose room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Gateway" error={errors.gatewayId?.message}>
          <select
            {...register('gatewayId')}
            className="h-8 w-full rounded-md border border-slate-400 bg-white px-3 text-sm text-slate-950 outline-none"
          >
            <option value="">Choose gateway</option>
            {gateways.map((gateway) => (
              <option key={gateway.id} value={gateway.id}>
                {gateway.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="ThingsBoard device ID"
          error={errors.tbDeviceId?.message}
          hint="Optional. UUID dari ThingsBoard, dibutuhkan buat power control."
        >
          <Input
            placeholder="e.g. 11111111-1111-4111-8111-111111111111"
            {...register('tbDeviceId')}
          />
        </Field>

        <Field
          label="Reporting interval (minutes)"
          error={errors.intervalMinutes?.message}
        >
          <Input
            type="number"
            min={15}
            {...register('intervalMinutes')}
            aria-invalid={!!errors.intervalMinutes}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save device'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-950">{label}</label>
      {children}
      {error ? (
        <span className="text-xs text-status-error">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-400">{hint}</span>
      ) : null}
    </div>
  );
}
