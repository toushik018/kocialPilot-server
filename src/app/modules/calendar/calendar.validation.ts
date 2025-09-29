import { z } from 'zod';

export const yearMonthParamsSchema = z.object({
  year: z
    .string()
    .regex(/^\d{4}$/)
    .transform((v) => parseInt(v, 10)),
  month: z
    .string()
    .regex(/^(0?[1-9]|1[0-2])$/)
    .transform((v) => parseInt(v, 10)),
});

export const dateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
