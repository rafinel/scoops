import { productTelemetryContextSchema } from './product-telemetry-context-schema.ts'
import { createProductTelemetryEventSchema } from './product-telemetry-event-schema-helpers.ts'
import { z } from 'zod'

const stockEntryFieldsSchema = z
  .array(z.enum(['inputMode', 'quantity', 'justification', 'packageQuantity']))
  .min(1)
  .refine((fields) => new Set(fields).size === fields.length)

const stockEntryFailureCodeSchema = z.enum([
  'invalid_input',
  'dependency_unavailable',
  'unauthorized',
  'forbidden',
  'conflict',
  'rate_limited',
  'network_error',
  'server_error',
  'unknown',
])

const stockEntryContext = productTelemetryContextSchema.shape

export const stockEntryTelemetryPayloadSchema = z.union([
  createProductTelemetryEventSchema({
    event: z.literal('workflow_started'),
    workflow: z.literal('stock_entry'),
    workflow_id: z.string().min(1),
    ...stockEntryContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_completed'),
    workflow: z.literal('stock_entry'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    duration_ms: z.number().finite().nonnegative().optional(),
    ...stockEntryContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_validation_failed'),
    workflow: z.literal('stock_entry'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    fields: stockEntryFieldsSchema,
    ...stockEntryContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_blocked'),
    workflow: z.literal('stock_entry'),
    workflow_id: z.string().min(1),
    fields: stockEntryFieldsSchema,
    phase: z.literal('validation'),
    failure_code: z.literal('invalid_input'),
    ...stockEntryContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_failed'),
    workflow: z.literal('stock_entry'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    phase: z.literal('submission'),
    failure_code: stockEntryFailureCodeSchema,
    status_class: z.enum(['4xx', '5xx']).optional(),
    ...stockEntryContext,
  }),
])
