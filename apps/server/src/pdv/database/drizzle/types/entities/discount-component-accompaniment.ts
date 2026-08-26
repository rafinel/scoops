import type { InferSelectModel } from 'drizzle-orm'

import type { discountComponentAccompanimentModel } from '@/pdv/database/drizzle/models/discount-component-accompaniment-model'

export type DrizzleDiscountComponentAccompaniment = InferSelectModel<
  typeof discountComponentAccompanimentModel
>
