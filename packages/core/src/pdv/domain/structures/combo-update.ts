import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'

export type ComboUpdate = {
  readonly name: string
  readonly fixedPrice: number
  readonly components: readonly DiscountComponent[]
  readonly expectedUpdatedAt: Date
}
