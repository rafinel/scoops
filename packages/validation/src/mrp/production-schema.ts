import { z } from 'zod'

export const productionSchema = z
  .object({
    quantity: z.number().finite().positive().refine(hasAtMostThreeDecimalPlaces),
  })
  .strict()

function hasAtMostThreeDecimalPlaces(value: number): boolean {
  return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
}
