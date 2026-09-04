import { z } from 'zod'

import { continuationTokenSchema } from './continuation-token-schema.ts'
import { passwordSchema } from './password-schema.ts'

export const resetPasswordSchema = z
  .object({ token: continuationTokenSchema, password: passwordSchema })
  .strict()
