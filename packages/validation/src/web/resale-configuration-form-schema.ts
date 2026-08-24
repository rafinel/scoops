import { z } from 'zod'

export const resaleConfigurationFormSchema = z.strictObject({
  price: z
    .string()
    .refine(
      isNonNegativeScaleTwoCurrency,
      'Informe um preço válido, com até duas casas decimais.',
    ),
  isActive: z.boolean(),
})

function isNonNegativeScaleTwoCurrency(value: string): boolean {
  const normalizedValue = value.trim().replace(',', '.')

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) return false

  return Number.isFinite(Number(normalizedValue)) && Number(normalizedValue) >= 0
}
