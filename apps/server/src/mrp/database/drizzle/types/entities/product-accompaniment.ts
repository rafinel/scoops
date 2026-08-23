import type { InferSelectModel } from 'drizzle-orm'

import type { productAccompanimentModel } from '../../models/product-accompaniment-model'

export type DrizzleProductAccompaniment = InferSelectModel<
  typeof productAccompanimentModel
>
