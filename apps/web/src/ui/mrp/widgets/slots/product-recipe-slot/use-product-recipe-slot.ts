import { useEffect, useState } from 'react'
import type { RecipeIngredientDetails } from '@scoops/core/mrp/domain/structures'
import { useProductRecipeQuery } from '@/ui/mrp/hooks/use-product-recipe-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type RecipeSlotAction =
  | { kind: 'add' | 'produce' }
  | { kind: 'edit' | 'remove'; ingredient: RecipeIngredientDetails }

export function useProductRecipeSlot(productId: string) {
  const { data: productStock, isPending: isProductPending } =
    useProductStockQuery(productId)
  const isManufacturable =
    productStock?.product.categories.includes('manufacturable') ?? false
  const {
    data: recipeDetails,
    isError: hasRecipeError,
    isPending: isRecipePending,
    refetch: refetchRecipe,
  } = useProductRecipeQuery(productId, isManufacturable)
  const { navigateTo, navigateToPath } = useNavigation()
  const [selectedAction, setSelectedAction] = useState<RecipeSlotAction>()

  useEffect(() => {
    if (productStock && !isManufacturable) {
      void navigateToPath(`/products/${productId}/stock`)
    }
  }, [isManufacturable, navigateToPath, productId, productStock])
  function handleBack() {
    void navigateTo('products')
  }
  function handleActionOpenChange(open: boolean) {
    if (!open) setSelectedAction(undefined)
  }
  function handleActionSuccess() {
    setSelectedAction(undefined)
    void refetchRecipe()
  }
  return {
    details: recipeDetails,
    isError: hasRecipeError,
    isLoading: isProductPending || (isManufacturable && isRecipePending),
    isUnsupported: Boolean(productStock && !isManufacturable),
    product: productStock?.product ?? recipeDetails?.product,
    selectedAction,
    handleActionOpenChange,
    handleActionSuccess,
    handleBack,
    handleRetry: () => void refetchRecipe(),
    setSelectedAction,
  }
}
