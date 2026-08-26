import type { InferSelectModel } from 'drizzle-orm'

import type { discountComponentModel } from '@/pdv/database/drizzle/models/discount-component-model'

export type DrizzleDiscountComponent = InferSelectModel<typeof discountComponentModel>
