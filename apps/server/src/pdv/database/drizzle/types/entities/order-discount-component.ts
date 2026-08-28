import type { InferSelectModel } from 'drizzle-orm'

import type { orderDiscountComponentAccompanimentModel } from '@/pdv/database/drizzle/models/order-discount-component-accompaniment-model'
import type { orderDiscountComponentModel } from '@/pdv/database/drizzle/models/order-discount-component-model'

export type DrizzleOrderDiscountComponent = InferSelectModel<
  typeof orderDiscountComponentModel
>
export type DrizzleOrderDiscountComponentAccompaniment = InferSelectModel<
  typeof orderDiscountComponentAccompanimentModel
>
