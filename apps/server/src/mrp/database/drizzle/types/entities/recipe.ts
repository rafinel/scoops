import type { InferSelectModel } from 'drizzle-orm'

import type { recipeModel } from '../../models/recipe-model'

export type DrizzleRecipe = InferSelectModel<typeof recipeModel>
