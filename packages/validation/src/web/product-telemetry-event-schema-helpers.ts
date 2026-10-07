import { productTelemetryContextSchema } from './product-telemetry-context-schema.ts'
import { productTelemetryMetadataSchema } from './product-telemetry-metadata-schema.ts'
import { z } from 'zod'

type EventShape = z.ZodRawShape

export function createProductTelemetryEventSchema<TShape extends EventShape>(
  shape: TShape,
  options: { hasOptionalContext?: boolean } = {},
) {
  return options.hasOptionalContext
    ? createOptionalContextEventSchema(shape)
    : createEventSchema(shape)
}

function createOptionalContextEventSchema<TShape extends EventShape>(shape: TShape) {
  return z.union([
    createEventSchema(shape),
    createEventSchema({ ...shape, ...productTelemetryContextSchema.shape }),
  ])
}

function createEventSchema<TShape extends EventShape>(shape: TShape) {
  return z.strictObject({ ...productTelemetryMetadataSchema.shape, ...shape })
}
