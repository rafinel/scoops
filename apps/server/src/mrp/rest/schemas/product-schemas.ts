import {
  ProductCategory,
  ProductSortDirection,
  ProductSortField,
  ProductStatus,
  ProductStockControl,
  ProductUnit,
  StockSituation,
} from '@scoops/core/mrp/domain/structures'
import { z } from 'zod'

const categorySchema = z.enum(
  Object.values(ProductCategory) as [ProductCategory, ...ProductCategory[]],
)

export const listProductsQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    category: z.union([categorySchema, z.array(categorySchema)]).optional(),
    status: z.enum([ProductStatus.Active, ProductStatus.Inactive]).optional(),
    stockSituation: z.enum([StockSituation.Normal, StockSituation.Low]).optional(),
    sortBy: z
      .enum([
        ProductSortField.CreatedAt,
        ProductSortField.Name,
        ProductSortField.StockQuantity,
        ProductSortField.BrandCount,
        ProductSortField.Categories,
        ProductSortField.Unit,
      ])
      .default(ProductSortField.CreatedAt),
    sortDirection: z
      .enum([ProductSortDirection.Ascending, ProductSortDirection.Descending])
      .default(ProductSortDirection.Descending),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict()

export const registerProductSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    unit: z.enum([
      ProductUnit.Gram,
      ProductUnit.Milliliter,
      ProductUnit.Kilogram,
      ProductUnit.Liter,
      ProductUnit.Unit,
    ]),
    categories: z.array(categorySchema).min(1),
    stockControl: z.enum([ProductStockControl.Single, ProductStockControl.ByBrand]),
    allowNegativeStock: z.boolean().default(false),
    idealStock: z.number().min(0),
    initialStock: z.number().min(0).optional(),
    brands: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(120),
          packageQuantity: z.number().min(0),
          packageValue: z.number().min(0),
          initialQuantity: z.number().min(0),
          isPrimary: z.boolean(),
        }),
      )
      .optional(),
  })
  .strict()
