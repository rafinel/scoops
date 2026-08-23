import { z } from 'zod'

const positiveQuantitySchema = z
  .string()
  .refine(
    isPositiveScaleThreeQuantity,
    'Informe uma quantidade maior que zero, com até três casas decimais.',
  )

export const productAccompanimentFormSchema = z
  .object({
    accompanimentProductId: z.string().trim().min(1, 'Selecione um acompanhamento.'),
    accompanimentTypeId: z.string().trim().min(1, 'Selecione um tipo.'),
    quantityPerPortion: positiveQuantitySchema,
  })
  .strict()

function isPositiveScaleThreeQuantity(value: string): boolean {
  const normalizedValue = value.trim().replace(',', '.')

  if (!/^(?:\d+|\d*\.\d{1,3})$/.test(normalizedValue)) return false

  const quantity = Number(normalizedValue)

  return Number.isFinite(quantity) && quantity > 0
}
