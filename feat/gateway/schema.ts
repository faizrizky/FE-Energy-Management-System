import { z } from 'zod';

/**
 * Validation for Add/Edit gateway (Figma: "Installation - gateway - add" node 25:27463).
 *
 * NOTE: Figma also shows an "Installed by" dropdown field — dropped here because
 * there's no matching column on the Gateway Prisma model (no createdById/installedBy),
 * so sending it would be silently discarded by the backend.
 */
export const gatewayFormSchema = z.object({
  name: z.string().min(1, 'Gateway name is required').max(120),
  eui: z.string().min(1, 'Gateway EUI is required'),
  simcard: z.string().min(1, 'Simcard is required'),
  installationDate: z.string().min(1, 'Installation date is required'),
  powerSource: z.string().min(1, 'Power source is required'),
  modelUnit: z.string().min(1, 'Model unit is required'),
  description: z.string().max(500).optional().or(z.literal('')),
});

export type GatewayFormValues = z.infer<typeof gatewayFormSchema>;
