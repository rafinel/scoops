import { z } from 'zod'

export const productTelemetryMetadataSchema = z.strictObject({
  schema_version: z.literal(1),
  environment: z.enum(['stg', 'prod']),
})
