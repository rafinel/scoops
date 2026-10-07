import { productTelemetryContextSchema } from './product-telemetry-context-schema.ts'
import { createProductTelemetryEventSchema } from './product-telemetry-event-schema-helpers.ts'
import { z } from 'zod'

const productCreationFieldsSchema = z
  .array(
    z.enum([
      'name',
      'unit',
      'categories',
      'stockControl',
      'allowNegativeStock',
      'currentUnitCost',
      'initialStock',
      'idealStock',
      'brands',
      'brands.*.id',
      'brands.*.name',
      'brands.*.unit',
      'brands.*.packageQuantity',
      'brands.*.packagePrice',
      'brands.*.packageCount',
      'brands.*.isPrimary',
    ]),
  )
  .min(1)
  .refine((fields) => new Set(fields).size === fields.length)

const productCreationFailureCodeSchema = z.enum([
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

const productCreationContext = productTelemetryContextSchema.shape

export const productCreationTelemetryPayloadSchema = z.union([
  createProductTelemetryEventSchema({
    event: z.literal('workflow_started'),
    workflow: z.literal('product_creation'),
    workflow_id: z.string().min(1),
    ...productCreationContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_completed'),
    workflow: z.literal('product_creation'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    duration_ms: z.number().finite().nonnegative().optional(),
    ...productCreationContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_validation_failed'),
    workflow: z.literal('product_creation'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    fields: productCreationFieldsSchema,
    ...productCreationContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_blocked'),
    workflow: z.literal('product_creation'),
    workflow_id: z.string().min(1),
    fields: productCreationFieldsSchema,
    phase: z.literal('validation'),
    failure_code: z.literal('invalid_input'),
    ...productCreationContext,
  }),
  createProductTelemetryEventSchema({
    event: z.literal('workflow_failed'),
    workflow: z.literal('product_creation'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    phase: z.literal('submission'),
    failure_code: productCreationFailureCodeSchema,
    status_class: z.enum(['4xx', '5xx']).optional(),
    ...productCreationContext,
  }),
])
