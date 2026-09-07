import { UserProfile } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const userReactivatedEventSchema = z.strictObject({
  userId: z.uuid(),
  establishmentId: z.uuid(),
  email: z.email().max(254),
  userName: z.string().trim().min(1),
  actorUserId: z.uuid(),
  previousStatus: z.literal('inactive'),
  profile: z.enum(UserProfile),
  status: z.literal('active'),
  updatedAt: z.iso.datetime(),
})
