import { z } from 'zod'

export const userInvitationPreparedEventSchema = z
  .object({
    userId: z.uuid(),
    establishmentId: z.uuid(),
    email: z.email().max(254),
    name: z.string().trim().min(1),
    actionUrl: z
      .url()
      .refine((value) => value.startsWith('http://') || value.startsWith('https://')),
    expiresAt: z.iso.datetime(),
    occurredAt: z.iso.datetime(),
    operation: z.enum(['initial', 'corrected', 'resent']),
  })
  .strict()
