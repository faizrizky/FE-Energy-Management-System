import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const scheduleFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Schedule name is required').max(120),

    description: z.string().trim().max(500).optional().or(z.literal('')),

    roomId: z.string().min(1, 'Room is required'),

    action: z.enum(['on', 'off'], {
      message: 'Action is required',
    }),

    startTime: z.string().regex(timeRegex, 'Invalid start time'),

    durationConstraint: z.enum(['no-end', 'end-at']).default('no-end'),

    endTime: z
      .string()
      .regex(timeRegex, 'Invalid end time')
      .optional()
      .or(z.literal('')),

    repeatType: z.enum(['none', 'weekly']),

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

    if (values.durationConstraint === 'end-at') {
      if (!values.endTime) {
        ctx.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'End time is required',
        });
      } else if (values.endTime === values.startTime) {
        ctx.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'End time cannot be the same as start time',
        });
      }
    }
  });

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
