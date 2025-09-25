import z4 from 'zod/v4';

export const userSchema = z4.object({
  id: z4.string(),
  username: z4.string(),
  email: z4.email(),
  createdAt: z4.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  updatedAt: z4.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
});
