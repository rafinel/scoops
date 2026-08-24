import { z } from 'zod'

export const productSizeFormSchema = z.discriminatedUnion('variant', [
  z.strictObject({
    variant: z.literal('add'),
    name: z.string().trim().min(1, 'Informe o nome do tamanho.').max(120),
    quantity: z
      .string()
      .refine(
        isPositiveScaleThreeQuantity,
        'Informe uma quantidade maior que zero, com até três casas decimais.',
      ),
    price: z
      .string()
      .refine(
        isNonNegativeScaleTwoCurrency,
        'Informe um preço válido, com até duas casas decimais.',
      ),
  }),
  z.strictObject({
    variant: z.literal('edit'),
    name: z.string().trim().min(1, 'Informe o nome do tamanho.').max(120),
    quantity: z
      .string()
      .refine(
        isPositiveScaleThreeQuantity,
        'Informe uma quantidade maior que zero, com até três casas decimais.',
      ),
    price: z
      .string()
      .refine(
        isNonNegativeScaleTwoCurrency,
        'Informe um preço válido, com até duas casas decimais.',
      ),
    isActive: z.boolean(),
  }),
])

function isPositiveScaleThreeQuantity(value: string): boolean {
  const normalizedValue = value.trim().replace(',', '.')

  if (!/^(?:\d+|\d*\.\d{1,3})$/.test(normalizedValue)) return false

  return Number.isFinite(Number(normalizedValue)) && Number(normalizedValue) > 0
}

function isNonNegativeScaleTwoCurrency(value: string): boolean {
  const normalizedValue = value.trim().replace(',', '.')

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) return false

  return Number.isFinite(Number(normalizedValue)) && Number(normalizedValue) >= 0
}
