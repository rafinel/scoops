import { UserProfile } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const userProfileUpdatedEventSchema = z
  .strictObject({
    userId: z.uuid(),
    establishmentId: z.uuid(),
    email: z.email().max(254),
    userName: z.string().trim().min(1),
    actorUserId: z.uuid(),
    previousProfile: z.enum(UserProfile),
    profile: z.enum(UserProfile),
    updatedAt: z.iso.datetime(),
  })
  .refine((value) => value.previousProfile !== value.profile, {
    message: 'O perfil anterior e o atual devem ser diferentes.',
    path: ['profile'],
  })
