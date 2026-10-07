import { useEffect, useState } from 'react'
import type { RecipeDetails } from '@scoops/core/mrp/domain/structures'
import { useProductionPreviewQuery } from '@/ui/mrp/hooks/use-production-preview-query'
import { useRegisterProductionAction } from '@/ui/mrp/hooks/use-register-production-action'
import { useProductionDialogTelemetry } from './use-production-observation-telemetry'

export function useProduceProductDialog({
  open,
  productId,
  recipe,
}: {
  open: boolean
  productId: string
  recipe: RecipeDetails
}) {
  const [hasUserInput, setHasUserInput] = useState(false)
  const [mode, setMode] = useState<'batches' | 'quantity'>('batches')
  const [value, setValue] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const { quantity, isInputValid, validationError } = getProductionInputState(
    value,
    mode,
    recipe.yieldQuantity,
  )

  useProductionDialogReset(open, setError, setHasUserInput, setMode, setValue)

  // The preview query retains prior data and owns its refresh indicator.
  const preview = useProductionPreviewQuery(
    productId,
    Number.isFinite(quantity) ? quantity : 0,
    isInputValid,
  )
  const production = useRegisterProductionAction(productId)

  const { handleConfirm } = useProductionDialogTelemetry({
    hasUserInput,
    isInputValid,
    mode,
    onError: setError,
    open,
    preview,
    production,
    quantity,
    validationError,
  })

  const handleModeChange = createProductionModeHandler({
    currentMode: mode,
    quantity,
    yieldQuantity: recipe.yieldQuantity,
    setHasUserInput,
    setMode,
    setValue,
  })

  const handleValueChange = (nextValue: string) =>
    changeProductionValue(nextValue, setHasUserInput, setValue)

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
    setValue: handleValueChange,
  }
}

function useProductionDialogReset(
  open: boolean,
  setError: (error: string | null) => void,
  setHasUserInput: (hasUserInput: boolean) => void,
  setMode: (mode: 'batches' | 'quantity') => void,
  setValue: (value: string) => void,
) {
  useEffect(() => {
    if (!open) return
    setHasUserInput(false)
    setMode('batches')
    setValue('1')
    setError(null)
  }, [open, setError, setHasUserInput, setMode, setValue])
}

function getProductionInputState(
  value: string,
  mode: 'batches' | 'quantity',
  yieldQuantity: number,
) {
  const numericValue = Number(value)
  const quantity = mode === 'batches' ? numericValue * yieldQuantity : numericValue
  const isInputValid = isValidProductionInput(mode, numericValue, quantity)
  const validationError = getProductionValidationError(mode, isInputValid)
  return { isInputValid, quantity, validationError }
}

function isValidProductionInput(
  mode: 'batches' | 'quantity',
  numericValue: number,
  quantity: number,
) {
  return mode === 'batches'
    ? isWholePositiveBatch(numericValue)
    : isPositiveProductionQuantity(quantity)
}

function isPositiveProductionQuantity(quantity: number) {
  return (
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Math.abs(quantity * 1_000 - Math.round(quantity * 1_000)) < 1e-8
  )
}

function isWholePositiveBatch(value: number) {
  return Number.isFinite(value) && value > 0 && Number.isInteger(value)
}

function getProductionValidationError(
  mode: 'batches' | 'quantity',
  isInputValid: boolean,
) {
  if (isInputValid) return null
  if (mode === 'batches') return 'Informe um número inteiro positivo de lotes.'
  return 'Informe uma quantidade positiva com até três casas decimais.'
}

function getValueForProductionMode(
  nextMode: 'batches' | 'quantity',
  quantity: number,
  yieldQuantity: number,
) {
  if (nextMode === 'quantity') return String(quantity)
  return Number.isInteger(quantity / yieldQuantity)
    ? String(quantity / yieldQuantity)
    : '1'
}

function changeProductionMode(
  nextMode: 'batches' | 'quantity',
  state: {
    currentMode: 'batches' | 'quantity'
    quantity: number
    yieldQuantity: number
    setHasUserInput: (hasUserInput: boolean) => void
    setMode: (mode: 'batches' | 'quantity') => void
    setValue: (value: string) => void
  },
) {
  if (nextMode === state.currentMode) return
  state.setHasUserInput(true)
  state.setMode(nextMode)
  state.setValue(getValueForProductionMode(nextMode, state.quantity, state.yieldQuantity))
}

function createProductionModeHandler(state: Parameters<typeof changeProductionMode>[1]) {
  return (nextMode: 'batches' | 'quantity') => changeProductionMode(nextMode, state)
}

function changeProductionValue(
  value: string,
  setHasUserInput: (hasUserInput: boolean) => void,
  setValue: (value: string) => void,
) {
  setHasUserInput(true)
  setValue(value)
}
