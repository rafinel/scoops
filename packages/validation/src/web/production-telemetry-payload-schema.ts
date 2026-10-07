import { productTelemetryContextSchema } from './product-telemetry-context-schema.ts'
import { createProductTelemetryEventSchema } from './product-telemetry-event-schema-helpers.ts'
import { z } from 'zod'

const productionFieldsSchema = z
  .array(z.enum(['batches', 'quantity']))
  .min(1)
  .refine((fields) => new Set(fields).size === fields.length)

const productionContext = productTelemetryContextSchema.shape

const productionBlockSchema = z.union([
  createProductTelemetryEventSchema({
    event: z.literal('workflow_blocked'),
    workflow: z.literal('production'),
    workflow_id: z.string().min(1),
    fields: productionFieldsSchema,
    phase: z.literal('validation'),
    failure_code: z.literal('invalid_input'),
    ...productionContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_blocked'),
    workflow: z.literal('production'),
    workflow_id: z.string().min(1),
    fields: productionFieldsSchema,
    phase: z.literal('preview'),
    failure_code: z.enum(['insufficient_stock', 'dependency_unavailable', 'unknown']),
    ...productionContext,
  }),
])

const productionFailureSchema = z.union([
  createProductTelemetryEventSchema({
    event: z.literal('workflow_failed'),
    workflow: z.literal('production'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    phase: z.literal('submission'),
    failure_code: z.enum([
      'invalid_input',
      'insufficient_stock',
      'dependency_unavailable',
      'unauthorized',
      'forbidden',
      'conflict',
      'rate_limited',
      'network_error',
      'server_error',
      'unknown',
    ]),
    status_class: z.enum(['4xx', '5xx']).optional(),
    ...productionContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_failed'),
    workflow: z.literal('production'),
    workflow_id: z.string().min(1),
    phase: z.literal('preview'),
    failure_code: z.enum([
      'invalid_input',
      'dependency_unavailable',
      'unauthorized',
      'forbidden',
      'conflict',
      'rate_limited',
      'network_error',
      'server_error',
      'unknown',
    ]),
    status_class: z.enum(['4xx', '5xx']).optional(),
    ...productionContext,
  }),
])

export const productionTelemetryPayloadSchema = z.union([
  createProductTelemetryEventSchema({
    event: z.literal('workflow_started'),
    workflow: z.literal('production'),
    workflow_id: z.string().min(1),
    ...productionContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_completed'),
    workflow: z.literal('production'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    duration_ms: z.number().finite().nonnegative().optional(),
    ...productionContext,
  }),
  productionBlockSchema,
  productionFailureSchema,
])
