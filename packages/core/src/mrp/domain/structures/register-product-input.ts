import type { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { ProductRegistrationBrandInput } from '#mrp/domain/structures/product-registration-brand-input.ts'
import type { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type RegisterProductInput = {
  readonly name: string
  readonly unit: ProductUnit
  readonly categories: readonly ProductCategory[]
  readonly stockControl: ProductStockControl
  readonly allowNegativeStock?: boolean
  readonly idealStock: number
  readonly currentUnitCost?: number
  readonly initialStock?: number
  readonly brands?: readonly ProductRegistrationBrandInput[]
}
