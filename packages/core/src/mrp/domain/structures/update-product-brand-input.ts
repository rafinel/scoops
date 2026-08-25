import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type UpdateProductBrandInput = {
  readonly name: string
  readonly unit?: ProductUnit
  readonly packageQuantity: number
  readonly packageValue: number
}
