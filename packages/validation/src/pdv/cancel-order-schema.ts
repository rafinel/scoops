import { z } from 'zod'

const optionalReasonSchema = z
  .string()
  .trim()
  .max(500, 'O motivo deve ter no máximo 500 caracteres.')
  .transform((value) => (value === '' ? undefined : value))
  .optional()

export const cancelOrderSchema = z.strictObject({
  reason: optionalReasonSchema,
})

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
