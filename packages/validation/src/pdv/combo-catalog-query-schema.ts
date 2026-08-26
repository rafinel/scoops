import { SaleItemKind } from '@scoops/core/pdv/domain/structures'
import { z } from 'zod'

const optionalSearchSchema = z
  .string()
  .trim()
  .max(120)
  .transform((value) => (value === '' ? undefined : value))
  .optional()

export const comboCatalogQuerySchema = z.strictObject({
  search: optionalSearchSchema,
  kind: z.enum(SaleItemKind).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})
