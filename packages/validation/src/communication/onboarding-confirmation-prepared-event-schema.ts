import { z } from 'zod'

const preparedEventFields = {
  userId: z.uuid(),
  email: z.email().max(254),
  name: z.string().trim().min(1),
  actionUrl: z
    .url()
    .refine((value) => value.startsWith('http://') || value.startsWith('https://')),
  expiresAt: z.iso.datetime(),
  occurredAt: z.iso.datetime(),
}

export const onboardingConfirmationPreparedEventSchema = z
  .object(preparedEventFields)
  .strict()
