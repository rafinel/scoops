import type { OrderStatus } from '#pdv/domain/structures/order-status.ts'

export type OrderListParams = {
  readonly establishmentId: string
  readonly search?: string
  readonly createdFrom?: Date
  readonly createdTo?: Date
  readonly channelId?: string | null
  readonly status?: OrderStatus
  readonly page: number
  readonly pageSize: number
}
