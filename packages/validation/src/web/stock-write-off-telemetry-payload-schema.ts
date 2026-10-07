import { productTelemetryContextSchema } from './product-telemetry-context-schema.ts'
import { createProductTelemetryEventSchema } from './product-telemetry-event-schema-helpers.ts'
import { z } from 'zod'

const stockWriteOffFieldsSchema = z
  .array(z.enum(['inputMode', 'quantity', 'justification', 'packageQuantity']))
  .min(1)
  .refine((fields) => new Set(fields).size === fields.length)

const stockWriteOffContext = productTelemetryContextSchema.shape

export const stockWriteOffTelemetryPayloadSchema = z.union([
  createProductTelemetryEventSchema({
    event: z.literal('workflow_started'),
    workflow: z.literal('stock_write_off'),
    workflow_id: z.string().min(1),
    ...stockWriteOffContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_completed'),
    workflow: z.literal('stock_write_off'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    duration_ms: z.number().finite().nonnegative().optional(),
    ...stockWriteOffContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_validation_failed'),
    workflow: z.literal('stock_write_off'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    fields: stockWriteOffFieldsSchema,
    ...stockWriteOffContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_blocked'),
    workflow: z.literal('stock_write_off'),
    workflow_id: z.string().min(1),
    fields: stockWriteOffFieldsSchema,
    phase: z.literal('validation'),
    failure_code: z.enum(['invalid_input', 'insufficient_stock']),
    ...stockWriteOffContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_failed'),
    workflow: z.literal('stock_write_off'),
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
    ...stockWriteOffContext,
  }),
])
