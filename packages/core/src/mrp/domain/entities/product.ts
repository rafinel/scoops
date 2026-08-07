import type { Entity } from '#shared/domain/entities/entity.ts'
import type { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import type { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type Product = Entity & {
  establishmentId: string
  name: string
  unit: ProductUnit
  categories: readonly ProductCategory[]
  stockControl: ProductStockControl
  status: ProductStatus
  idealStock?: number
  internalNotes?: string
  createdAt: Date
  updatedAt: Date
}

export type ProductCreate = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>

export type ProductUpdate = Partial<
  Pick<
    Product,
    | 'name'
    | 'unit'
    | 'categories'
    | 'stockControl'
    | 'status'
    | 'idealStock'
    | 'internalNotes'
  >
>
