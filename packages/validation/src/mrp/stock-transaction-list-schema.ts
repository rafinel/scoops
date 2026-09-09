import { StockTransactionType } from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const stockTransactionListSchema = z
  .object({
    type: z.enum(StockTransactionType).optional(),
    brandId: z.uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(({ from, to }) => !from || !to || from <= to, {
    message: 'A data final deve ser igual ou posterior à data inicial.',
    path: ['to'],
  })
