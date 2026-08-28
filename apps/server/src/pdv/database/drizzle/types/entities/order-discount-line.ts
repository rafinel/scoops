import type { InferSelectModel } from 'drizzle-orm'

import type { orderDiscountLineModel } from '@/pdv/database/drizzle/models/order-discount-line-model'

export type DrizzleOrderDiscountLine = InferSelectModel<typeof orderDiscountLineModel>
