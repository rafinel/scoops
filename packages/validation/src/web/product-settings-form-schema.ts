import { ProductStatus } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const productSettingsFormSchema = z.strictObject({
  name: z.string().trim().min(1, 'Informe o nome do produto.').max(120),
  idealStock: z
    .string()
    .trim()
    .refine(isEmptyOrNonNegativeScaleThree, {
      message: 'Informe um estoque ideal válido, com até três casas decimais.',
    })
    .transform((value) => (value === '' ? null : value)),
  status: z.enum(ProductStatus),
  allowNegativeStock: z.boolean(),
  internalNotes: z
    .string()
    .trim()
    .max(2000, 'As observações devem ter no máximo 2000 caracteres.')
    .transform((value) => (value === '' ? null : value)),
})

function isEmptyOrNonNegativeScaleThree(value: string): boolean {
  if (value === '') return true

  const normalizedValue = value.replace(',', '.')

  if (!/^(?:\d+|\d*\.\d{1,3})$/.test(normalizedValue)) return false

  return Number.isFinite(Number(normalizedValue)) && Number(normalizedValue) >= 0
}
