import { z } from 'zod'

const quantitySchema = z.number().finite().positive().refine(hasAtMostThreeDecimalPlaces)

export const addRecipeIngredientSchema = z
  .object({
    ingredientProductId: z.uuid(),
    ingredientBrandId: z.uuid().optional(),
    quantity: quantitySchema,
  })
  .strict()

export const updateRecipeIngredientSchema = z
  .object({
    ingredientBrandId: z.uuid().optional(),
    quantity: quantitySchema,
  })
  .strict()

function hasAtMostThreeDecimalPlaces(value: number): boolean {
  return Math.abs(value * 1_000 - Math.round(value * 1_000)) < 1e-8
}
