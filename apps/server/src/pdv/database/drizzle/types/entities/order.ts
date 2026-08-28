import type { InferSelectModel } from 'drizzle-orm'

import type { orderModel } from '@/pdv/database/drizzle/models/order-model'

export type DrizzleOrder = InferSelectModel<typeof orderModel>
