import { z } from 'zod'

import { continuationTokenSchema } from './continuation-token-schema.ts'
import { emailSchema } from './email-schema.ts'
import { passwordSchema } from './password-schema.ts'

export const correctOnboardingEmailSchema = z
  .object({
    continuationToken: continuationTokenSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict()
