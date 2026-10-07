import { useEffect, useRef, useState } from 'react'
import type { FieldErrors } from 'react-hook-form'

import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'
import type { WorkflowHandle } from '@scoops/core/shared/interfaces'

import { useAdjustProductStockAction } from '../../../../hooks/use-adjust-product-stock-action'
import { useStockAdjustmentTelemetry } from './use-stock-adjustment-telemetry'
import {
  useStockAdjustmentForm,
  type StockAdjustmentFormValues,
} from './use-stock-adjustment-form'
import {
  recordStockAdjustmentValidationFailure,
  submitStockAdjustment,
} from './submit-stock-adjustment'

export type UseStockAdjustmentDialogProps = UseStockAdjustmentDialogCommonProps &
  (
    | { type: 'entry'; workflow: WorkflowHandle<'stock_entry'> }
    | { type: 'write-off'; workflow: WorkflowHandle<'stock_write_off'> }
  )

export function useStockAdjustmentDialog(props: UseStockAdjustmentDialogProps) {
  const { allowNegativeStock, brand, currentBalance, isOpen, productId, type, workflow } =
    props
  const adjustment = useAdjustProductStockAction(productId)
  const hasRelevantInput = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const stockForm = useStockAdjustmentForm({ brand, currentBalance, type })
  const {
    errors,
    handleSubmit: submitForm,
    inputMode,
    isInsufficient: isBalanceInsufficient,
    quantity,
    register,
    reset,
    setValue,
  } = stockForm
  const isInsufficient = !allowNegativeStock && isBalanceInsufficient
  const { baseQuantity, prospectiveBalance } = stockForm
  const telemetry = useStockAdjustmentTelemetry({
    allowNegativeStock,
    hasRelevantInput,
    isInsufficient,
    isOpen,
    type,
    workflow,
  })

  useEffect(() => {
    resetStockAdjustmentDialog({
      hasRelevantInput,
      isOpen,
      packageQuantity: brand?.brand.packageQuantity,
      reset,
      setFormError,
    })
  }, [brand?.brand.packageQuantity, isOpen, reset])

  function handleInputModeChange(value: FormValues['inputMode']) {
    telemetry.markRelevantInput()
    setValue('inputMode', value, { shouldDirty: true, shouldValidate: true })
    setFormError(null)
  }

  function handleQuantityChange() {
    telemetry.markRelevantInput()
    setFormError(null)
  }

  function handleJustificationChange() {
    setFormError(null)
  }

  function handleValidSubmit(values: FormValues) {
    return submitStockAdjustment({
      adjustment,
      props,
      reset,
      setFormError,
      telemetry,
      values,
    })
  }

  function handleInvalidSubmit(errors: FieldErrors<FormValues>) {
    recordStockAdjustmentValidationFailure(props, telemetry, errors)
  }

  return {
    baseQuantity,
    errors,
    formError,
    inputMode,
    isInsufficient,
    isPending: adjustment.isPending,
    justification: stockForm.justification,
    prospectiveBalance,
    quantity,
    handleInputModeChange,
    handleJustificationChange,
    handleQuantityChange,
    handleSubmit: submitForm(handleValidSubmit, handleInvalidSubmit),
    register,
  }
}

type FormValues = StockAdjustmentFormValues

const STOCK_ADJUSTMENT_RESET_VALUES = {
  inputMode: 'baseUnit',
  quantity: '',
  justification: '',
} as const

type ResetStockAdjustmentDialogInput = {
  hasRelevantInput: { current: boolean }
  isOpen: boolean
  packageQuantity?: number
  reset: ReturnType<typeof useStockAdjustmentForm>['reset']
  setFormError: (error: string | null) => void
}

function resetStockAdjustmentDialog(input: ResetStockAdjustmentDialogInput) {
  resetStockAdjustmentForm(input)
  clearStockAdjustmentTransientState(input)
}

function resetStockAdjustmentForm({
  packageQuantity,
  reset,
}: ResetStockAdjustmentDialogInput) {
  reset({ ...STOCK_ADJUSTMENT_RESET_VALUES, packageQuantity })
}

function clearStockAdjustmentTransientState({
  hasRelevantInput,
  isOpen,
  setFormError,
}: ResetStockAdjustmentDialogInput) {
  if (!isOpen) return
  hasRelevantInput.current = false
  setFormError(null)
}

type UseStockAdjustmentDialogCommonProps = {
  allowNegativeStock: boolean
  brand?: ProductBrandStock
  currentBalance: number
  isOpen: boolean
  productId: string
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}
