import { DiscountComponentKind, DiscountStatus } from '@scoops/core/pdv/domain/structures'
import { z } from 'zod'

import { nameSchema } from '../identity/name-schema.ts'

const productIdSchema = z.uuid()

const positiveIntegerSchema = z
  .number({ error: 'Informe uma quantidade válida.' })
  .finite('Informe uma quantidade válida.')
  .int('Informe uma quantidade inteira.')
  .positive('Informe uma quantidade maior que zero.')

const accompanimentIdsSchema = z
  .array(z.uuid())
  .refine(
    (accompanimentIds) => new Set(accompanimentIds).size === accompanimentIds.length,
    {
      message: 'Os acompanhamentos não podem se repetir.',
    },
  )

const portionComponentSchema = z.strictObject({
  kind: z.literal(DiscountComponentKind.Portion),
  productId: productIdSchema,
  quantity: positiveIntegerSchema,
  sizeId: z.uuid(),
  accompanimentIds: accompanimentIdsSchema,
})

const resaleComponentSchema = z.strictObject({
  kind: z.literal(DiscountComponentKind.Resale),
  productId: productIdSchema,
  quantity: positiveIntegerSchema,
  brandId: z.uuid().optional(),
})

const discountComponentSchema = z.discriminatedUnion('kind', [
  portionComponentSchema,
  resaleComponentSchema,
])

export const saveComboSchema = z.strictObject({
  name: nameSchema,
  status: z.enum(DiscountStatus, { error: 'Selecione um status válido.' }),
  fixedPrice: z
    .number({ error: 'Informe um preço válido.' })
    .finite('Informe um preço válido.')
    .positive('Informe um preço maior que zero.')
    .refine(hasAtMostTwoDecimalPlaces, 'Use no máximo duas casas decimais.'),
  components: z
    .array(discountComponentSchema)
    .min(2, 'Adicione pelo menos dois produtos ao Combo.'),
})

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
}
