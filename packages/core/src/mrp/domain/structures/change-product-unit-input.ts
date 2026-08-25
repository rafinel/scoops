import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type ChangeProductUnitInput = {
  targetUnit: ProductUnit
  expectedUpdatedAt: Date
}
