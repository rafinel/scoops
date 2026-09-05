import { StockAdjustmentType } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const adjustProductStockSchema = z
  .object({
    brandId: z.uuid().optional(),
    type: z.enum(StockAdjustmentType),
    quantity: z.number().finite().positive(),
    currentUnitCost: z
      .number()
      .finite()
      .nonnegative()
      .refine(hasAtMostSixDecimalPlaces)
      .optional(),
    justification: z
      .string()
      .transform((value) => {
        const trimmedValue = value.trim()

        return trimmedValue === '' ? undefined : trimmedValue
      })
      .optional(),
  })
  .strict()

function hasAtMostSixDecimalPlaces(value: number): boolean {
  return Math.abs(value * 1_000_000 - Math.round(value * 1_000_000)) < 1e-8
}
