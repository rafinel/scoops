import type { RecipeIngredient } from '#mrp/domain/entities/recipe-ingredient.ts'

export type RecipeIngredientUpdate = Partial<
  Pick<RecipeIngredient, 'ingredientBrandId' | 'quantity'>
>
