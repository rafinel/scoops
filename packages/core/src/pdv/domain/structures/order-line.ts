import type { AccompanimentSnapshot } from '#pdv/domain/structures/accompaniment-snapshot.ts'
import type { BrandSnapshot } from '#pdv/domain/structures/brand-snapshot.ts'
import type { ProductSizeSnapshot } from '#pdv/domain/structures/product-size-snapshot.ts'
import type { ProductSnapshot } from '#pdv/domain/structures/product-snapshot.ts'
import type { StockConsumption } from '#pdv/domain/structures/stock-consumption.ts'

export type OrderLine = {
  readonly product: ProductSnapshot
  readonly brand?: BrandSnapshot
  readonly size?: ProductSizeSnapshot
  readonly accompaniments: readonly AccompanimentSnapshot[]
  readonly quantity: number
  readonly baseUnitPrice: number
  readonly finalUnitPrice: number
  readonly subtotal: number
  readonly consumptions: readonly StockConsumption[]
}
