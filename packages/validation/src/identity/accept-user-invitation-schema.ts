import { z } from 'zod'

import { continuationTokenSchema } from './continuation-token-schema.ts'

export const acceptUserInvitationSchema = z
  .object({ confirmationToken: continuationTokenSchema })
  .strict()
