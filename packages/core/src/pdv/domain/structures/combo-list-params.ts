import type { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'
import type { DiscountType } from '#pdv/domain/structures/discount-type.ts'

export type ComboListParams = {
  readonly establishmentId: string
  readonly search?: string
  readonly type?: DiscountType
  readonly status?: DiscountStatus
  readonly page: number
  readonly pageSize: number
}
