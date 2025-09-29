import { z } from 'zod';

export const idsArraySchema = z.object({
  postIds: z.array(z.string().min(1, 'Invalid ID')).min(1, 'postIds cannot be empty'),
});

export type IdsArrayInput = z.infer<typeof idsArraySchema>;
