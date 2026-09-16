import type { InferSelectModel } from 'drizzle-orm'
import type { orderLineCostComponentModel } from '@/pdv/database/drizzle/models/order-line-cost-component-model'

export type DrizzleOrderLineCostComponent = InferSelectModel<
  typeof orderLineCostComponentModel
>
