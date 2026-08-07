import type { CartDiscount } from '#pdv/domain/structures/cart-discount.ts'
import type { CartLine } from '#pdv/domain/structures/cart-line.ts'

export type Cart = {
  readonly establishmentId: string
  readonly channelId?: string
  readonly lines: readonly CartLine[]
  readonly discounts: readonly CartDiscount[]
  readonly subtotal: number
  readonly totalDiscount: number
  readonly total: number
}
