import { z } from 'zod'

import { continuationTokenSchema } from './continuation-token-schema.ts'

export const onboardingTokenSchema = z
  .object({ continuationToken: continuationTokenSchema })
  .strict()
