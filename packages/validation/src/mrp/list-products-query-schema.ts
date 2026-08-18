import {
  ProductSortDirection,
  ProductSortField,
  ProductStatus,
  StockSituation,
} from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

import { productCategorySchema } from './product-category-schema.ts'

export const listProductsQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    category: z.union([productCategorySchema, z.array(productCategorySchema)]).optional(),
    status: z.enum(ProductStatus).optional(),
    stockSituation: z.enum(StockSituation).optional(),
    sortBy: z.enum(ProductSortField).default(ProductSortField.CreatedAt),
    sortDirection: z.enum(ProductSortDirection).default(ProductSortDirection.Descending),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict()
