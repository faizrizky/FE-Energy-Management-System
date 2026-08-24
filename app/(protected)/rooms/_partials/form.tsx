"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { roomFormSchema, type RoomFormValues } from "@/feat/rooms/schema";

interface RoomFormProps {
  defaultValues?: Partial<RoomFormValues>;
  onSubmit: (values: RoomFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

/** Add / Edit room form — validated with the shared `roomFormSchema`. */
export function RoomForm({ defaultValues, onSubmit, onCancel, submitting }: RoomFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      location: "",
      gatewayId: "",
      description: "",
      isCritical: false,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Room name" error={errors.name?.message}>
        <Input placeholder="e.g. Ruang 101" {...register("name")} aria-invalid={!!errors.name} />
      </Field>

      <Field label="Location" error={errors.location?.message}>
        <Input placeholder="e.g. Building A, Floor 1" {...register("location")} aria-invalid={!!errors.location} />
      </Field>

      <Field label="Gateway" error={errors.gatewayId?.message}>
        <Input placeholder="Gateway ID" {...register("gatewayId")} aria-invalid={!!errors.gatewayId} />
      </Field>

      <Field label="Description">
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          placeholder="What is this room used for?"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-950">
        <Checkbox {...register("isCritical")} />
        Mark as critical room
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save room"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-950">{label}</label>
      {children}
      {error && <span className="text-xs text-status-error">{error}</span>}
    </div>
  );
}
