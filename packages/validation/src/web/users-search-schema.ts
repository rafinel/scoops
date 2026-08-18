import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import { z } from 'zod'

export const usersSearchSchema = z.object({
  search: z.string().default(''),
  profile: z.enum(UserProfile).optional().catch(undefined),
  status: z.enum(UserStatus).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
})
