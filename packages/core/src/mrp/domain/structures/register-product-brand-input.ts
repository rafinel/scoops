import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type RegisterProductBrandInput = {
  readonly name: string
  readonly unit?: ProductUnit
  readonly packageQuantity: number
  readonly packageValue: number
  readonly initialQuantity: number
}
