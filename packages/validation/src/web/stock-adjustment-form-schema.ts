import { z } from 'zod'

const positiveQuantityStringSchema = z.string().refine((value) => {
  const number = Number(value)

  return value.trim() !== '' && Number.isFinite(number) && number > 0
}, 'Informe uma quantidade maior que zero.')

export const stockAdjustmentFormSchema = z
  .object({
    inputMode: z.enum(['baseUnit', 'package']),
    quantity: positiveQuantityStringSchema,
    packageQuantity: z.number().finite().positive().optional(),
  })
  .superRefine(({ inputMode, packageQuantity }, context) => {
    if (inputMode === 'package' && packageQuantity === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Não foi possível calcular a quantidade por embalagem.',
        path: ['quantity'],
      })
    }
  })
