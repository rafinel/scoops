import type { InferSelectModel } from 'drizzle-orm'

import type { discountModel } from '@/pdv/database/drizzle/models/discount-model'

export type DrizzleDiscount = InferSelectModel<typeof discountModel>
