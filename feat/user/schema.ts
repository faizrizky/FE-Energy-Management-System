import { z } from 'zod';

export const userFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(120),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  roleId: z.string().min(1, 'Role is required'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
