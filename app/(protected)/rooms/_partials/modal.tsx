'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { RoomForm } from './form';
import { roomsClientApi } from '@/feat/rooms/api.client';
import type { RoomFormValues } from '@/feat/rooms/schema';
import type { RoomDTO } from '@/feat/rooms/dto';
import type { UserSummaryDTO } from '@/feat/user/dto';

interface RoomFormModalProps {
  open: boolean;
  room?: RoomDTO;
  users: UserSummaryDTO[];
  onOpenChange: (open: boolean) => void;
  onSuccess: (room: RoomDTO) => void;
}

/** Modal wrapper for Add/Edit room (Figma: "Rooms - add" / "Rooms - edit"). */
export function RoomFormModal({
  open,
  room,
  users,
  onOpenChange,
  onSuccess,
}: RoomFormModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (values: RoomFormValues) => {
    setSubmitting(true);
    try {
      const saved = room
        ? await roomsClientApi.update(room.id, values)
        : await roomsClientApi.create(values);
      onSuccess(saved);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,0.5)] p-4 backdrop-blur-[5px]">
      <div className="flex max-h-[90vh] w-full max-w-[550px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-emerald-500">
            {room ? 'Edit room' : 'Add room'}
          </h2>
          <button aria-label="Close" onClick={() => onOpenChange(false)}>
            <X className="size-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <RoomForm
            users={users}
            isEdit={!!room}
            defaultValues={
              room
                ? {
                    name: room.name,
                    picName: room.picName ?? '',
                    picPhone: room.picPhone ?? '',
                    location: room.location,
                    description: room.description ?? '',
                    isCritical: room.isCritical,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}
