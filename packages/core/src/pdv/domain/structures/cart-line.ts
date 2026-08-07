import type { CartLineInput } from '#pdv/domain/structures/cart-line-input.ts'
import type { StockConsumption } from '#pdv/domain/structures/stock-consumption.ts'

export type CartLine = CartLineInput & {
  readonly baseUnitPrice: number
  readonly finalUnitPrice: number
  readonly subtotal: number
  readonly consumptions: readonly StockConsumption[]
}
