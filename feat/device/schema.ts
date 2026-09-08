import { z } from 'zod';

export const deviceFormSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(120),
  eui: z.string().min(1, 'Device EUI is required'),
  deviceType: z.string().min(1, 'Component type is required'),
  roomId: z.string().min(1, 'Room is required'),
  gatewayId: z.string().min(1, 'Gateway is required'),
  tbDeviceId: z.string().optional().or(z.literal('')),
  intervalMinutes: z.coerce
    .number()
    .int()
    .min(60, 'Minimum interval is 60 minutes'),
});

export type DeviceFormValues = z.infer<typeof deviceFormSchema>;
