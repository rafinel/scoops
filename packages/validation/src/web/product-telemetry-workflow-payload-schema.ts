import { onboardingTelemetryPayloadSchema } from './onboarding-telemetry-payload-schema.ts'
import { productCreationTelemetryPayloadSchema } from './product-creation-telemetry-payload-schema.ts'
import { productionTelemetryPayloadSchema } from './production-telemetry-payload-schema.ts'
import { stockEntryTelemetryPayloadSchema } from './stock-entry-telemetry-payload-schema.ts'
import { stockWriteOffTelemetryPayloadSchema } from './stock-write-off-telemetry-payload-schema.ts'
import { z } from 'zod'

export const productTelemetryWorkflowPayloadSchema = z.union([
  onboardingTelemetryPayloadSchema,
  productCreationTelemetryPayloadSchema,
  stockEntryTelemetryPayloadSchema,
  stockWriteOffTelemetryPayloadSchema,
  productionTelemetryPayloadSchema,
])
