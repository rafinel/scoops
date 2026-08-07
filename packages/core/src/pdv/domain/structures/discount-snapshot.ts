import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'
import type { DiscountType } from '#pdv/domain/structures/discount-type.ts'

export type DiscountSnapshot = {
  readonly discountId: string
  readonly name: string
  readonly type: DiscountType
  readonly fixedPrice: number
  readonly components: readonly DiscountComponent[]
}
