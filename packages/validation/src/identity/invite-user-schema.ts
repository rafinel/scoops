import { z } from 'zod'

import { emailSchema } from './email-schema.ts'
import { nameSchema } from './name-schema.ts'
import { userProfileSchema } from './user-profile-schema.ts'

export const inviteUserSchema = z
  .object({ name: nameSchema, email: emailSchema, profile: userProfileSchema })
  .strict()
