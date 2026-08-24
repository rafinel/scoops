import { z } from 'zod'

export const saveProductResaleConfigurationSchema = z.strictObject({
  price: z.number().finite().nonnegative().refine(hasAtMostTwoDecimalPlaces),
  isActive: z.boolean(),
})

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
}
