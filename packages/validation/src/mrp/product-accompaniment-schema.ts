import { z } from 'zod'

const quantitySchema = z.number().finite().positive().refine(hasAtMostThreeDecimalPlaces)

export const linkProductAccompanimentSchema = z
  .object({
    accompanimentProductId: z.uuid(),
    accompanimentTypeId: z.uuid(),
    quantityPerPortion: quantitySchema,
  })
  .strict()

export const updateProductAccompanimentSchema = z
  .object({
    accompanimentTypeId: z.uuid(),
    quantityPerPortion: quantitySchema,
  })
  .strict()

function hasAtMostThreeDecimalPlaces(value: number): boolean {
  return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
}
