import { featureVisitedTelemetrySchema } from './feature-visited-telemetry-schema.ts'
import { productTelemetryWorkflowPayloadSchema } from './product-telemetry-workflow-payload-schema.ts'
import { z } from 'zod'

export const productTelemetryPayloadSchema = z.union([
  featureVisitedTelemetrySchema,
  productTelemetryWorkflowPayloadSchema,
])
