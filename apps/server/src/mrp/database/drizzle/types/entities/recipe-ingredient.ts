import type { InferSelectModel } from 'drizzle-orm'

import type { recipeIngredientModel } from '../../models/recipe-ingredient-model'

export type DrizzleRecipeIngredient = InferSelectModel<typeof recipeIngredientModel>
