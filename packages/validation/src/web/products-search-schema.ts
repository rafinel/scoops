import {
  ProductCategory,
  ProductSortDirection,
  ProductSortField,
  ProductStatus,
  StockSituation,
} from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

export const productsSearchSchema = z.object({
  search: z.string().catch(''),
  categories: z.array(z.enum(ProductCategory)).catch([]),
  status: z.enum(ProductStatus).optional().catch(undefined),
  stockSituation: z.enum(StockSituation).optional().catch(undefined),
  sortBy: z.enum(ProductSortField).catch(ProductSortField.CreatedAt),
  sortDirection: z.enum(ProductSortDirection).catch(ProductSortDirection.Descending),
  page: z.coerce.number().int().min(1).catch(1),
})
