import { z } from 'zod';

export const scheduleFormSchema = z
  .object({
    roomId: z.string().min(1, 'Room is required'),

    deviceId: z.string().optional().or(z.literal('')),

    action: z.enum(['on', 'off'], {
      message: 'Action is required',
    }),

    scheduledDate: z.string().min(1, 'Date is required'),

    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid start time'),

    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid end time')
      .optional()
      .or(z.literal('')),

    repeatType: z.enum(['none', 'daily', 'weekly']),

    repeatDays: z.array(z.number().int().min(0).max(6)).default([]),
  })
  .superRefine((values, ctx) => {
    if (values.repeatType === 'weekly' && values.repeatDays.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['repeatDays'],
        message: 'Select at least one day',
      });
    }

    if (values.endTime && values.startTime === values.endTime) {
      ctx.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time cannot be the same as start time',
      });
    }
  });

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
