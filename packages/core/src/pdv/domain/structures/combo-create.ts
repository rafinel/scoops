import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'
import type { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'

export type ComboCreate = {
  readonly establishmentId: string
  readonly name: string
  readonly status: DiscountStatus
  readonly fixedPrice: number
  readonly components: readonly DiscountComponent[]
}
