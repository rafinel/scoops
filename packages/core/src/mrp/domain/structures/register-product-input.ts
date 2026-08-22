import type { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { RegisterProductBrandInput } from '#mrp/domain/structures/register-product-brand-input.ts'

export type RegisterProductInput = {
  readonly name: string
  readonly unit: ProductUnit
  readonly categories: readonly ProductCategory[]
  readonly stockControl: ProductStockControl
  readonly allowNegativeStock?: boolean
  readonly idealStock: number
  readonly currentUnitCost?: number
  readonly initialStock?: number
  readonly brands?: readonly RegisterProductBrandInput[]
}
