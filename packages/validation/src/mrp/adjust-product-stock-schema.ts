import { StockAdjustmentType } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const adjustProductStockSchema = z
  .object({
    brandId: z.uuid().optional(),
    type: z.enum(StockAdjustmentType),
    quantity: z.number().finite().positive(),
  })
  .strict()
