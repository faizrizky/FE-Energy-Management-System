"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { RoomForm } from "./form";
import { roomsApi } from "@/feat/rooms/api";
import type { RoomFormValues } from "@/feat/rooms/schema";
import type { RoomDetailDTO, RoomListItemDTO } from "@/feat/rooms/dto";

interface RoomFormModalProps {
  open: boolean;
  room?: RoomListItemDTO;
  onOpenChange: (open: boolean) => void;
  onSuccess: (room: RoomDetailDTO) => void;
}

/** Modal wrapper for Add/Edit room (Figma: "Rooms - add" / "Rooms - edit"). */
export function RoomFormModal({ open, room, onOpenChange, onSuccess }: RoomFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (values: RoomFormValues) => {
    setSubmitting(true);
    try {
      const saved = room ? await roomsApi.update(room.id, values) : await roomsApi.create(values);
      onSuccess(saved);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-emerald-500">{room ? "Edit room" : "Add room"}</h2>
          <button aria-label="Close" onClick={() => onOpenChange(false)}>
            <X className="size-5 text-slate-500" />
          </button>
        </div>

        <RoomForm
          defaultValues={room ? { name: room.name, location: room.location, gatewayId: room.gatewayId } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
