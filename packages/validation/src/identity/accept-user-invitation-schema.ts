import { z } from 'zod'

import { continuationTokenSchema } from './continuation-token-schema.ts'
import { passwordSchema } from './password-schema.ts'

export const acceptUserInvitationSchema = z
  .object({ confirmationToken: continuationTokenSchema, password: passwordSchema })
  .strict()
