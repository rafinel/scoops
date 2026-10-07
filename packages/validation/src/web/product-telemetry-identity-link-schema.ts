import { z } from 'zod'

export const productTelemetryIdentityLinkSchema = z.strictObject({
  event: z.literal('$identify'),
  distinct_id: z.string().min(1),
  $anon_distinct_id: z.string().min(1),
})
