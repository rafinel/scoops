import { DiscountStatus, DiscountType } from '@scoops/core/pdv/domain/structures'
import { z } from 'zod'

const optionalSearchSchema = z
  .string()
  .trim()
  .max(120)
  .transform((value) => (value === '' ? undefined : value))
  .optional()

export const comboListQuerySchema = z.strictObject({
  search: optionalSearchSchema,
  type: z.enum(DiscountType).optional(),
  status: z.enum(DiscountStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})
