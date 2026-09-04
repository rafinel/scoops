import { z } from 'zod'

import { continuationTokenSchema } from './continuation-token-schema.ts'

export const confirmOnboardingSchema = z.strictObject({
  confirmationToken: continuationTokenSchema,
})
