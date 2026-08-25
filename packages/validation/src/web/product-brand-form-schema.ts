import { ProductUnit } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

const brandNameSchema = z
  .string()
  .trim()
  .min(1, 'Informe o nome da marca.')
  .max(120, 'O nome da marca deve ter no máximo 120 caracteres.')

const positiveNumericStringSchema = z.string().refine((value) => {
  const number = Number(value)

  return value.trim() !== '' && Number.isFinite(number) && number > 0
}, 'Informe uma quantidade por embalagem maior que zero.')

const nonNegativeCurrencyStringSchema = z.string().refine((value) => {
  const number = Number(value)

  return value.trim() !== '' && Number.isFinite(number) && number >= 0
}, 'Informe um valor por embalagem válido.')

const nonNegativeStockStringSchema = z.string().refine((value) => {
  const number = Number(value)

  return value.trim() !== '' && Number.isFinite(number) && number >= 0
}, 'Informe um estoque inicial válido.')

export const productBrandFormSchema = z.discriminatedUnion('variant', [
  z.strictObject({
    variant: z.literal('add'),
    name: brandNameSchema,
    unit: z.enum(ProductUnit),
    packageQuantity: positiveNumericStringSchema,
    packageValue: nonNegativeCurrencyStringSchema,
    initialQuantity: nonNegativeStockStringSchema,
  }),
  z.strictObject({
    variant: z.literal('edit'),
    name: brandNameSchema,
    unit: z.enum(ProductUnit),
    packageQuantity: positiveNumericStringSchema,
    packageValue: nonNegativeCurrencyStringSchema,
  }),
])
