import type { DiscountSnapshot } from '#pdv/domain/structures/discount-snapshot.ts'

export type OrderDiscount = {
  readonly discount: DiscountSnapshot
  readonly savings: number
  readonly lineProductIds: readonly string[]
}
