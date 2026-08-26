import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'
import { ProductRecipeCard } from './product-recipe-card'
import { ProduceProductDialog } from './produce-product-dialog'
import { RecipeError } from './recipe-error'
import { RecipeIngredientDialog } from './recipe-ingredient-dialog'
import { RecipeLoading } from './recipe-loading'
import { RemoveRecipeIngredientDialog } from './remove-recipe-ingredient-dialog'
import { useProductRecipeSlot } from './use-product-recipe-slot'

export type ProductRecipeSlotProps = { productId: string }
export const ProductRecipeSlot = ({ productId }: ProductRecipeSlotProps) => {
  const {
    details,
    handleActionOpenChange,
    handleActionSuccess,
    handleAddAction,
    handleBack,
    handleEditAction,
    handleProduceAction,
    handleRemoveAction,
    handleRetry,
    isError,
    isLoading,
    isUnsupported,
    product,
    selectedAction,
  } = useProductRecipeSlot(productId)
  return (
    <ProductDetailsPage onBack={handleBack} product={product} selectedTab='recipe'>
      {isLoading && !isUnsupported ? <RecipeLoading /> : null}
      {isError && !isUnsupported ? <RecipeError onRetry={handleRetry} /> : null}
      {details && !isLoading && !isError && !isUnsupported ? (
        <>
          <ProductRecipeCard
            details={details}
            onAdd={handleAddAction}
            onEdit={handleEditAction}
            onProduce={handleProduceAction}
            onRemove={handleRemoveAction}
          />
          {selectedAction?.kind === 'add' || selectedAction?.kind === 'edit' ? (
            <RecipeIngredientDialog
              existingProductIds={
                details.recipe?.ingredients.map(
                  (ingredient) => ingredient.ingredientProductId,
                ) ?? []
              }
              ingredient={
                selectedAction.kind === 'edit' ? selectedAction.ingredient : undefined
              }
              onOpenChange={handleActionOpenChange}
              onSuccess={handleActionSuccess}
              open
              productId={productId}
              recipeTotalCost={details.recipe?.totalCost ?? 0}
              unit={details.product.unit}
            />
          ) : null}
          {selectedAction?.kind === 'remove' ? (
            <RemoveRecipeIngredientDialog
              ingredient={selectedAction.ingredient}
              onOpenChange={handleActionOpenChange}
              onSuccess={handleActionSuccess}
              open
              productId={productId}
            />
          ) : null}
          {selectedAction?.kind === 'produce' && details.recipe ? (
            <ProduceProductDialog
              onOpenChange={handleActionOpenChange}
              onSuccess={handleActionSuccess}
              open
              product={details.product}
              recipe={details.recipe}
            />
          ) : null}
        </>
      ) : null}
    </ProductDetailsPage>
  )
}
