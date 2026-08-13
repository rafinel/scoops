import { z } from 'zod'
import { UserProfile } from '@scoops/core/identity/domain/structures'

export const changeUserProfileSchema = z
  .object({
    profile: z.enum([UserProfile.Manager, UserProfile.Operator]),
  })
  .strict()

export type ChangeUserProfileSchema = z.infer<typeof changeUserProfileSchema>
