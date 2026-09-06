import { z } from 'zod'

export const userInactivatedEventSchema = z.strictObject({
  userId: z.uuid(),
  establishmentId: z.uuid(),
  email: z.email().max(254),
  userName: z.string().trim().min(1),
  actorUserId: z.uuid(),
  previousStatus: z.literal('active'),
  status: z.literal('inactive'),
  updatedAt: z.iso.datetime(),
})
