import { ProductStockAlertState, ProductUnit } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

const alertStateSchema = z.enum([
  ProductStockAlertState.BelowIdeal,
  ProductStockAlertState.Zero,
])

export const productStockAlertStateEnteredEventSchema = z
  .strictObject({
    establishmentId: z.uuid(),
    productId: z.uuid(),
    productName: z.string().trim().min(1),
    unit: z.enum(ProductUnit),
    state: alertStateSchema,
    availableQuantity: z.number().finite(),
    idealQuantity: z.number().finite().nonnegative().optional(),
    occurredAt: z.iso.datetime(),
  })
  .superRefine((value, context) => {
    if (value.state === ProductStockAlertState.BelowIdeal) {
      if (value.availableQuantity <= 0)
        context.addIssue({
          code: 'custom',
          message: 'O estoque abaixo do ideal deve ser positivo.',
          path: ['availableQuantity'],
        })
      if (
        value.idealQuantity === undefined ||
        value.idealQuantity <= value.availableQuantity
      )
        context.addIssue({
          code: 'custom',
          message: 'O estoque ideal deve ser maior que o disponível.',
          path: ['idealQuantity'],
        })
    }

    if (value.state === ProductStockAlertState.Zero && value.availableQuantity > 0)
      context.addIssue({
        code: 'custom',
        message: 'O estoque zerado deve ser não positivo.',
        path: ['availableQuantity'],
      })
  })
