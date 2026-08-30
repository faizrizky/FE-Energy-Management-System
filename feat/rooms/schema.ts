import { z } from 'zod';

/**
 * Validation for the Add/Edit room form (Figma: "Rooms - add" / "Rooms - edit").
 *
 * NOTE: the Figma design also has "Interval", "Choose gateway", and
 * "Add device" fields on this form, but Room in the backend doesn't have
 * a gateway/interval/device relation at creation time — those live on
 * Device instead (see feat/device/schema.ts) and are assigned per-device
 * from the Device page. Only fields the API actually persists are here.
 */
export const roomFormSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(120),
  picName: z.string().min(1, 'Building PIC is required'),
  picPhone: z.string().min(1, 'PIC contact is required'),
  location: z.string().min(1, 'Room location is required'),
  description: z.string().max(500).optional().or(z.literal('')),
  isCritical: z.boolean().default(false),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;
