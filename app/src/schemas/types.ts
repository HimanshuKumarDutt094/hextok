import z4 from 'zod/v4';

export const userSchema = z4.object({
  username: z4.string(),
  createdAt: z4.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  updatedAt: z4.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
});
export const hexSchema = z4.object({
  hexValue: z4.string().regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, {
    message: 'Invalid hex color format',
  }),
  likeCount: z4.number().int().nonnegative().optional(),
  isLiked: z4.boolean().optional(),
});
export type UserResponse = z4.infer<typeof userSchema> & { id: string };
export type HexResponse = z4.infer<typeof hexSchema> & { id: string };
