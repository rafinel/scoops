import { z } from 'zod'

import { saveComboSchema } from '../pdv/save-combo-schema.ts'

const fixedPriceInputSchema = z
  .string({ error: 'Informe um preço válido.' })
  .trim()
  .refine(isValidFixedPriceInput, {
    message: 'Informe um preço válido, com até duas casas decimais.',
  })
  .transform(parseFixedPriceInput)

export const comboDiscountFormSchema = saveComboSchema.extend({
  fixedPrice: fixedPriceInputSchema,
})

function isValidFixedPriceInput(value: string): boolean {
  const normalizedValue = value.replace(',', '.')

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) return false

  const fixedPrice = Number(normalizedValue)

  return Number.isFinite(fixedPrice) && fixedPrice > 0
}

function parseFixedPriceInput(value: string): number {
  return Number(value.replace(',', '.'))
}
