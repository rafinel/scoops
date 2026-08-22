import type { Product } from '#mrp/domain/entities/product.ts'
import type { RecipeDetails } from '#mrp/domain/structures/recipe-details.ts'

export type ProductRecipeDetails = {
  readonly product: Product
  readonly recipe: RecipeDetails | null
}
