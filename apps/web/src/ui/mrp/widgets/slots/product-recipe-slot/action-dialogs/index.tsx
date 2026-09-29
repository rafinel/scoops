import type {
  ProductRecipeDetails,
  RecipeIngredientDetails,
} from '@scoops/core/mrp/domain/structures'

import { ProduceProductDialog } from '../produce-product-dialog'
import { RecipeIngredientDialog } from '../recipe-ingredient-dialog'
import { RemoveRecipeIngredientDialog } from '../remove-recipe-ingredient-dialog'
import type { RecipeSlotAction } from '../use-product-recipe-slot'

export type RecipeActionDialogsProps = {
  details: ProductRecipeDetails
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  productId: string
  selectedAction?: RecipeSlotAction
}

export const RecipeActionDialogs = ({
  details,
  onOpenChange,
  onSuccess,
  productId,
  selectedAction,
}: RecipeActionDialogsProps) => {
  if (selectedAction?.kind === 'add' || selectedAction?.kind === 'edit') {
    const ingredient: RecipeIngredientDetails | undefined =
      selectedAction.kind === 'edit' ? selectedAction.ingredient : undefined
    return (
      <RecipeIngredientDialog
        existingProductIds={
          details.recipe?.ingredients.map((item) => item.ingredientProductId) ?? []
        }
        ingredient={ingredient}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        open
        productId={productId}
        recipeTotalCost={details.recipe?.totalCost ?? 0}
        unit={details.product.unit}
      />
    )
  }

  if (selectedAction?.kind === 'remove') {
    return (
      <RemoveRecipeIngredientDialog
        ingredient={selectedAction.ingredient}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        open
        productId={productId}
      />
    )
  }

  return selectedAction?.kind === 'produce' && details.recipe ? (
    <ProduceProductDialog
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      open
      product={details.product}
      recipe={details.recipe}
    />
  ) : null
}
