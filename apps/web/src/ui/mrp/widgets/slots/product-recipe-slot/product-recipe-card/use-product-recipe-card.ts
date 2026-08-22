import { useEffect, useState } from 'react'
import type { RecipeDetails } from '@scoops/core/mrp/domain/structures'
import { useSaveRecipeYieldAction } from '@/ui/mrp/hooks/use-save-recipe-yield-action'

export function useProductRecipeCard(productId: string, recipe: RecipeDetails | null) {
  const saveAction = useSaveRecipeYieldAction(productId)
  const [yieldQuantity, setYieldQuantity] = useState(
    recipe?.yieldQuantity?.toString() ?? '',
  )
  const [error, setError] = useState<string | null>(null)
  useEffect(
    () => setYieldQuantity(recipe?.yieldQuantity?.toString() ?? ''),
    [recipe?.yieldQuantity],
  )
  const numericYield = Number(yieldQuantity)
  const isValidYield =
    Number.isFinite(numericYield) &&
    numericYield > 0 &&
    Math.round(numericYield * 1_000) === numericYield * 1_000
  async function handleSaveYield() {
    if (!isValidYield) {
      setError('Informe um rendimento positivo com até três casas decimais.')
      return
    }
    setError(null)
    try {
      await saveAction.saveRecipeYield({ yieldQuantity: numericYield })
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível salvar o rendimento.',
      )
    }
  }
  return {
    error,
    isPending: saveAction.isPending,
    isValidYield,
    yieldQuantity,
    handleSaveYield,
    setYieldQuantity,
  }
}
