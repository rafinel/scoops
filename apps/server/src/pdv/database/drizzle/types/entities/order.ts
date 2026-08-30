import type { InferSelectModel } from 'drizzle-orm'

import type { OrderStatus } from '@scoops/core/pdv/domain/structures'

import type { orderModel } from '@/pdv/database/drizzle/models/order-model'

type DrizzleOrderLifecycle = {
  readonly createdByName: string
  readonly status: OrderStatus
  readonly canceledAt: Date | null
  readonly canceledBy: string | null
  readonly canceledByName: string | null
  readonly cancellationReason: string | null
}

export type DrizzleOrder = Omit<
  InferSelectModel<typeof orderModel>,
  keyof DrizzleOrderLifecycle
> &
  DrizzleOrderLifecycle
