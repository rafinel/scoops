import type { Dispatch, SetStateAction } from 'react'
import type { UseFormReset, FieldErrors } from 'react-hook-form'

import type { useAdjustProductStockAction } from '../../../../hooks/use-adjust-product-stock-action'
import type { UseStockAdjustmentDialogProps } from './use-stock-adjustment-dialog'
import type { useStockAdjustmentTelemetry } from './use-stock-adjustment-telemetry'
import type { stockAdjustmentFormSchema } from '@scoops/validation'
import type { z } from 'zod'

type FormValues = z.infer<typeof stockAdjustmentFormSchema>
type Telemetry = ReturnType<typeof useStockAdjustmentTelemetry>

function buildStockAdjustmentInput(
  values: FormValues,
  props: UseStockAdjustmentDialogProps,
  quantity: number,
) {
  return {
    brandId: props.brand?.brand.id,
    quantity,
    justification: values.justification?.trim() || undefined,
  }
}

function isExcessiveStockWriteOff(
  props: UseStockAdjustmentDialogProps,
  submittedQuantity: number,
) {
  return (
    props.type === 'write-off' &&
    !props.allowNegativeStock &&
    submittedQuantity > props.currentBalance
  )
}

async function dispatchStockAdjustment(
  adjustment: ReturnType<typeof useAdjustProductStockAction>,
  telemetry: Telemetry,
  props: UseStockAdjustmentDialogProps,
  input: ReturnType<typeof buildStockAdjustmentInput>,
) {
  return props.type === 'entry'
    ? dispatchStockEntry(adjustment, telemetry, props, input)
    : dispatchStockWriteOff(adjustment, telemetry, props, input)
}

function dispatchStockEntry(
  adjustment: ReturnType<typeof useAdjustProductStockAction>,
  telemetry: Telemetry,
  props: UseStockAdjustmentDialogProps & { type: 'entry' },
  input: ReturnType<typeof buildStockAdjustmentInput>,
) {
  return adjustment.adjustProductStock(
    { ...input, type: 'entry' },
    telemetry.startAttempt(props.workflow),
  )
}

function dispatchStockWriteOff(
  adjustment: ReturnType<typeof useAdjustProductStockAction>,
  telemetry: Telemetry,
  props: UseStockAdjustmentDialogProps & { type: 'write-off' },
  input: ReturnType<typeof buildStockAdjustmentInput>,
) {
  return adjustment.adjustProductStock(
    { ...input, type: 'write-off' },
    telemetry.startAttempt(props.workflow),
  )
}

function resetStockAdjustmentForm(
  reset: UseFormReset<FormValues>,
  props: UseStockAdjustmentDialogProps,
) {
  reset({
    inputMode: 'baseUnit',
    quantity: '',
    justification: '',
    packageQuantity: props.brand?.brand.packageQuantity,
  })
}

function getStockAdjustmentErrorMessage(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : 'Não foi possível movimentar o estoque. Tente novamente.'
}

type SubmitStockAdjustmentInput = {
  adjustment: ReturnType<typeof useAdjustProductStockAction>
  props: UseStockAdjustmentDialogProps
  reset: UseFormReset<FormValues>
  setFormError: Dispatch<SetStateAction<string | null>>
  telemetry: Telemetry
  values: FormValues
}

export function submitStockAdjustment(input: SubmitStockAdjustmentInput): Promise<void> {
  const { props, values } = input
  const submittedQuantity = getSubmittedStockQuantity(values)
  if (isExcessiveStockWriteOff(props, submittedQuantity)) return Promise.resolve()
  return dispatchValidStockAdjustment(input, submittedQuantity)
}

function dispatchValidStockAdjustment(
  {
    adjustment,
    props,
    reset,
    setFormError,
    telemetry,
    values,
  }: SubmitStockAdjustmentInput,
  submittedQuantity: number,
): Promise<void> {
  setFormError(null)
  const input = buildStockAdjustmentInput(values, props, submittedQuantity)
  return dispatchStockAdjustment(adjustment, telemetry, props, input)
    .then(createStockAdjustmentSuccessHandler(reset, props))
    .catch(createStockAdjustmentErrorHandler(setFormError))
}

function getSubmittedStockQuantity(values: FormValues) {
  return (
    Number(values.quantity) *
    (values.inputMode === 'package' ? (values.packageQuantity ?? 0) : 1)
  )
}

function completeStockAdjustment(
  reset: UseFormReset<FormValues>,
  props: UseStockAdjustmentDialogProps,
) {
  resetStockAdjustmentForm(reset, props)
  props.onOpenChange(false)
  props.onSuccess()
}

function createStockAdjustmentSuccessHandler(
  reset: UseFormReset<FormValues>,
  props: UseStockAdjustmentDialogProps,
) {
  return () => completeStockAdjustment(reset, props)
}

function createStockAdjustmentErrorHandler(
  setFormError: Dispatch<SetStateAction<string | null>>,
) {
  return (error: unknown) => setFormError(getStockAdjustmentErrorMessage(error))
}

export function recordStockAdjustmentValidationFailure(
  props: Pick<UseStockAdjustmentDialogProps, 'type' | 'workflow'>,
  telemetry: Telemetry,
  errors: FieldErrors<FormValues>,
) {
  telemetry.recordValidationFailure(props.workflow, errors)
}
