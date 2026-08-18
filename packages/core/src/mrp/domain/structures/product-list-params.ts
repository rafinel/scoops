import type { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import type { StockSituation } from '#mrp/domain/structures/stock-situation.ts'

export type ProductListParams = {
  readonly establishmentId: string
  readonly search?: string
  readonly categories?: readonly ProductCategory[]
  readonly status?: ProductStatus
  readonly stockSituation?: StockSituation
  readonly sortBy?: ProductSortField
  readonly sortDirection?: ProductSortDirection
  readonly page: number
  readonly pageSize: number
}

export const ProductSortField = {
  CreatedAt: 'createdAt',
  Name: 'name',
  StockQuantity: 'stockQuantity',
  BrandCount: 'brandCount',
  Categories: 'categories',
  Unit: 'unit',
} as const

export type ProductSortField = (typeof ProductSortField)[keyof typeof ProductSortField]

export const ProductSortDirection = {
  Ascending: 'asc',
  Descending: 'desc',
} as const

export type ProductSortDirection =
  (typeof ProductSortDirection)[keyof typeof ProductSortDirection]
