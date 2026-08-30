import type { InferSelectModel } from 'drizzle-orm'

import type { orderStockRestorationModel } from '@/pdv/database/drizzle/models/order-stock-restoration-model'

export type DrizzleOrderStockRestoration = InferSelectModel<
  typeof orderStockRestorationModel
>
