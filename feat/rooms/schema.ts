import { z } from "zod";

/**
 * Validation for the Add/Edit room form (Figma: "Rooms - add" / "Rooms - edit").
 * Shared by the client form and, if needed, an API route handler.
 */
export const roomFormSchema = z.object({
  name: z.string().min(1, "Room name is required").max(120),
  location: z.string().min(1, "Location is required"),
  gatewayId: z.string().min(1, "Gateway is required"),
  description: z.string().max(500).optional(),
  isCritical: z.boolean().default(false),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;
