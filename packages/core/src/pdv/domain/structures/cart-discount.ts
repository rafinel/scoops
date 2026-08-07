import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'
import type { DiscountType } from '#pdv/domain/structures/discount-type.ts'

export type CartDiscount = {
  readonly discountId: string
  readonly name: string
  readonly type: DiscountType
  readonly fixedPrice: number
  readonly savings: number
  readonly components: readonly DiscountComponent[]
  readonly lineProductIds: readonly string[]
}
