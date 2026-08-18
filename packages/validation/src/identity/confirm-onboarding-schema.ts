import { z } from 'zod'

import { continuationTokenSchema } from './continuation-token-schema.ts'

export const confirmOnboardingSchema = z
  .object({ confirmationToken: continuationTokenSchema })
  .strict()
