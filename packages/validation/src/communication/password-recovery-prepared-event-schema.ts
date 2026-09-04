import { z } from 'zod'

export const passwordRecoveryPreparedEventSchema = z
  .object({
    userId: z.uuid(),
    email: z.email().max(254),
    name: z.string().trim().min(1),
    actionUrl: z
      .url()
      .refine((value) => value.startsWith('http://') || value.startsWith('https://')),
    expiresAt: z.iso.datetime(),
    occurredAt: z.iso.datetime(),
  })
  .strict()
