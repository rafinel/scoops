import type { InferSelectModel } from 'drizzle-orm'

import type { orderLineAccompanimentModel } from '@/pdv/database/drizzle/models/order-line-accompaniment-model'
import type { orderLineConsumptionModel } from '@/pdv/database/drizzle/models/order-line-consumption-model'
import type { orderLineModel } from '@/pdv/database/drizzle/models/order-line-model'
import type { OrderCostComponentSnapshot } from '@scoops/core/pdv/domain/structures'

export type DrizzleOrderLine = InferSelectModel<typeof orderLineModel> & {
  readonly costComponents?: readonly OrderCostComponentSnapshot[]
}
export type DrizzleOrderLineAccompaniment = InferSelectModel<
  typeof orderLineAccompanimentModel
>
export type DrizzleOrderLineConsumption = InferSelectModel<
  typeof orderLineConsumptionModel
>
