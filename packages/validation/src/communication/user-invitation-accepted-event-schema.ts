import { UserProfile } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const userInvitationAcceptedEventSchema = z.strictObject({
  userId: z.uuid(),
  establishmentId: z.uuid(),
  email: z.email().max(254),
  userName: z.string().trim().min(1),
  profile: z.enum(UserProfile),
  occurredAt: z.iso.datetime(),
})
