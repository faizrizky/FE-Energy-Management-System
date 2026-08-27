import { z } from 'zod';

export const roleFormSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(80),
  description: z.string().max(300).optional().or(z.literal('')),
  permissionIds: z.array(z.string()).default([]),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
