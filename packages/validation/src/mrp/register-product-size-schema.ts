import { z } from 'zod'

export const registerProductSizeSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  quantity: z.number().finite().positive().refine(hasAtMostThreeDecimalPlaces),
  price: z.number().finite().nonnegative().refine(hasAtMostTwoDecimalPlaces),
})

function hasAtMostThreeDecimalPlaces(value: number): boolean {
  return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
}

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
}
