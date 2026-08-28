import type { InferSelectModel } from 'drizzle-orm'

import type { orderDiscountModel } from '@/pdv/database/drizzle/models/order-discount-model'

export type DrizzleOrderDiscount = InferSelectModel<typeof orderDiscountModel>
