import { useState } from 'react'
import { useRemoveRecipeIngredientAction } from '@/ui/mrp/hooks/use-remove-recipe-ingredient-action'
export function useRemoveRecipeIngredientDialog(productId: string) {
  const action = useRemoveRecipeIngredientAction(productId)
  const [error, setError] = useState<string | null>(null)
  async function handleRemove(lineId: string, onSuccess: () => void) {
    setError(null)
    try {
      await action.removeRecipeIngredient(lineId)
      onSuccess()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível remover o ingrediente.',
      )
    }
  }
  return { error, isPending: action.isPending, handleRemove }
}
