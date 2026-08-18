import { z } from 'zod'

import { userProfileSchema } from './user-profile-schema.ts'
import { userStatusSchema } from './user-status-schema.ts'

export const listUsersQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    profile: userProfileSchema.optional(),
    status: userStatusSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
