import type { InferSelectModel } from 'drizzle-orm'

import type { productionIngredientModel } from '../../models/production-ingredient-model'

export type DrizzleProductionIngredient = InferSelectModel<
  typeof productionIngredientModel
>
