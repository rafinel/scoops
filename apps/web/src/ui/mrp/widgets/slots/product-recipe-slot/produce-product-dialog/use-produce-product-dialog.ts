import { useEffect, useState } from 'react'
import { productionSchema } from '@scoops/validation'
import type { RecipeDetails } from '@scoops/core/mrp/domain/structures'
import { useProductionPreviewQuery } from '@/ui/mrp/hooks/use-production-preview-query'
import { useRegisterProductionAction } from '@/ui/mrp/hooks/use-register-production-action'

export function useProduceProductDialog({
  open,
  productId,
  recipe,
}: {
  open: boolean
  productId: string
  recipe: RecipeDetails
}) {
  const [mode, setMode] = useState<'batches' | 'quantity'>('batches')
  const [value, setValue] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const numericValue = Number(value)
  const quantity = mode === 'batches' ? numericValue * recipe.yieldQuantity : numericValue
  const isPositiveQuantity =
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Math.abs(quantity * 1_000 - Math.round(quantity * 1_000)) < 1e-8
  const isWholePositiveBatch =
    Number.isFinite(numericValue) && numericValue > 0 && Number.isInteger(numericValue)
  const isInputValid = mode === 'batches' ? isWholePositiveBatch : isPositiveQuantity
  const validationError = isInputValid
    ? null
    : mode === 'batches'
      ? 'Informe um número inteiro positivo de lotes.'
      : 'Informe uma quantidade positiva com até três casas decimais.'
  const preview = useProductionPreviewQuery(
    productId,
    Number.isFinite(quantity) ? quantity : 0,
    isInputValid,
  )
  const production = useRegisterProductionAction(productId)
  useEffect(() => {
    if (open) {
      setMode('batches')
      setValue('1')
      setError(null)
    }
  }, [open])
  function handleModeChange(nextMode: 'batches' | 'quantity') {
    if (nextMode === mode) return
    setMode(nextMode)
    if (nextMode === 'quantity') setValue(String(quantity))
    else
      setValue(
        Number.isInteger(quantity / recipe.yieldQuantity)
          ? String(quantity / recipe.yieldQuantity)
          : '1',
      )
  }
  async function handleConfirm(onSuccess: () => void) {
    try {
      if (!isInputValid) {
        setError(validationError)
        return
      }
      productionSchema.parse({ quantity })
      if (!preview.data?.canProduce) return
      await production.registerProduction({ quantity })
      onSuccess()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível registrar a produção.',
      )
    }
  }
  return {
    error,
    isPending: production.isPending,
    isInputValid,
    mode,
    preview,
    quantity,
    validationError,
    value,
    handleConfirm,
    handleModeChange,
    setValue,
  }
}
