import type { Discount } from '#pdv/domain/entities/discount.ts'
import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'
import type { DiscountType } from '#pdv/domain/structures/discount-type.ts'

export type Combo = Discount & {
  type: Extract<DiscountType, 'combo'>
  fixedPrice: number
  components: readonly DiscountComponent[]
}
