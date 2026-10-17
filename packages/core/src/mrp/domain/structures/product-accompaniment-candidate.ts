import type { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type ProductAccompanimentCandidate = {
  readonly productId: string
  readonly name: string
  readonly unit: ProductUnit
  readonly stockControl: ProductStockControl
  readonly accompanimentPrice: number | null
  readonly isGlobal: boolean
  readonly hasPortionLinks: boolean
  readonly global?: {
    readonly accompanimentTypeId: string
    readonly quantityPerPortion: number
  }
}
