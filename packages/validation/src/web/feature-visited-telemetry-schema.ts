import { productTelemetryContextSchema } from './product-telemetry-context-schema.ts'
import { createProductTelemetryEventSchema } from './product-telemetry-event-schema-helpers.ts'
import { productTelemetryFeatureSchema } from './product-telemetry-feature-schema.ts'
import { z } from 'zod'

export const featureVisitedTelemetrySchema = createProductTelemetryEventSchema({
  event: z.literal('feature_visited'),
  feature: productTelemetryFeatureSchema,
  ...productTelemetryContextSchema.shape,
})
