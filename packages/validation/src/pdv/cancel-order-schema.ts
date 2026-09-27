import { z } from 'zod'

const optionalReasonSchema = z
  .string()
  .trim()
  .max(500, 'O motivo deve ter no máximo 500 caracteres.')
  .transform((value) => (value === '' ? undefined : value))
  .optional()

export const cancelOrderSchema = z.strictObject({
  reason: optionalReasonSchema,
  lineDispositions: z
    .array(
      z.strictObject({
        linePosition: z.number().int().nonnegative(),
        disposition: z.enum(['return', 'loss']),
      }),
    )
    .nonempty()
    .refine(
      (choices) =>
        new Set(choices.map(({ linePosition }) => linePosition)).size === choices.length,
      'Cada linha do pedido pode ter apenas um destino.',
    ),
})

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
