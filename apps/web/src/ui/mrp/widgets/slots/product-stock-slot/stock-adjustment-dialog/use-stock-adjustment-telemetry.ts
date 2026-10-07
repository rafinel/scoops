import { useEffect, useRef } from 'react'
import type { FieldErrors } from 'react-hook-form'

import type {
  AttemptHandle,
  ProductTelemetryFieldName,
  WorkflowHandle,
} from '@scoops/core/shared/interfaces'

import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'
import type { stockAdjustmentFormSchema } from '@scoops/validation'
import type { z } from 'zod'

type FormValues = z.infer<typeof stockAdjustmentFormSchema>
type StockWorkflow = 'stock_entry' | 'stock_write_off'
type AnalyticsRef = { current: ReturnType<typeof useAnalyticsContext> }
type StockAdjustmentTelemetryActions = {
  markRelevantInput: () => void
  recordValidationFailure: <TWorkflow extends StockWorkflow>(
    workflow: WorkflowHandle<TWorkflow>,
    errors: FieldErrors<FormValues>,
  ) => void
  startAttempt: <TWorkflow extends StockWorkflow>(
    workflow: WorkflowHandle<TWorkflow>,
  ) => AttemptHandle<TWorkflow>
}
type AdjustmentFields<TWorkflow extends StockWorkflow> = readonly [
  ProductTelemetryFieldName<TWorkflow>,
  ...ProductTelemetryFieldName<TWorkflow>[],
]

const STOCK_ADJUSTMENT_TELEMETRY_FIELDS = [
  'inputMode',
  'quantity',
  'justification',
  'packageQuantity',
] as const satisfies readonly ProductTelemetryFieldName<'stock_entry'>[]
const INSUFFICIENT_STOCK_BLOCK = {
  phase: 'validation',
  failureCode: 'insufficient_stock',
  fields: ['quantity'],
} as const

function getStockAdjustmentTelemetryFields<TWorkflow extends StockWorkflow>(
  errors: FieldErrors<FormValues>,
): AdjustmentFields<TWorkflow> | undefined {
  const fields = STOCK_ADJUSTMENT_TELEMETRY_FIELDS.filter((field) =>
    Boolean(errors[field]),
  )
  const [firstField, ...remainingFields] = fields
  return firstField
    ? ([firstField, ...remainingFields] as unknown as AdjustmentFields<TWorkflow>)
    : undefined
}

type StockAdjustmentTelemetryInput = {
  allowNegativeStock: boolean
  hasRelevantInput: { current: boolean }
  isInsufficient: boolean
  isOpen: boolean
  type: 'entry' | 'write-off'
  workflow: WorkflowHandle<'stock_entry'> | WorkflowHandle<'stock_write_off'>
}

function useStockAdjustmentAnalyticsRef(
  input: StockAdjustmentTelemetryInput,
): AnalyticsRef {
  const analytics = useAnalyticsContext()
  const analyticsRef = useRef(analytics)
  analyticsRef.current = analytics
  useWriteOffBlockTelemetry(input, analyticsRef)
  return analyticsRef
}

function useWriteOffBlockTelemetry(
  input: StockAdjustmentTelemetryInput,
  analyticsRef: AnalyticsRef,
) {
  const relevant = isWriteOffBlockRelevant(input)
  const workflow = input.workflow as WorkflowHandle<'stock_write_off'>
  const block = relevant && input.isInsufficient ? INSUFFICIENT_STOCK_BLOCK : null
  useEffect(() => {
    if (relevant) analyticsRef.current.recordBlock({ workflow, block })
  }, [analyticsRef, block, relevant, workflow])
}

function isWriteOffBlockRelevant({
  allowNegativeStock,
  hasRelevantInput,
  isOpen,
  type,
}: StockAdjustmentTelemetryInput) {
  return isOpen && type === 'write-off' && !allowNegativeStock && hasRelevantInput.current
}

function startStockAdjustmentAttempt<TWorkflow extends StockWorkflow>(
  analyticsRef: { current: ReturnType<typeof useAnalyticsContext> },
  workflow: WorkflowHandle<TWorkflow>,
) {
  return analyticsRef.current.startAttempt({ workflow })
}

function recordStockAdjustmentValidationFailure<TWorkflow extends StockWorkflow>(
  analyticsRef: { current: ReturnType<typeof useAnalyticsContext> },
  workflow: WorkflowHandle<TWorkflow>,
  errors: FieldErrors<FormValues>,
) {
  const attempt = startStockAdjustmentAttempt(analyticsRef, workflow)
  const fields = getStockAdjustmentTelemetryFields<TWorkflow>(errors)
  if (fields) analyticsRef.current.recordValidationFailure({ attempt, fields })
}

function markRelevantStockAdjustmentInput(input: StockAdjustmentTelemetryInput) {
  input.hasRelevantInput.current = true
}

function createStockAdjustmentTelemetryActions(
  input: StockAdjustmentTelemetryInput,
  analyticsRef: AnalyticsRef,
): StockAdjustmentTelemetryActions {
  return {
    markRelevantInput: markRelevantStockAdjustmentInput.bind(null, input),
    recordValidationFailure: <TWorkflow extends StockWorkflow>(
      workflow: WorkflowHandle<TWorkflow>,
      errors: FieldErrors<FormValues>,
    ) => recordStockAdjustmentValidationFailure(analyticsRef, workflow, errors),
    startAttempt: <TWorkflow extends StockWorkflow>(
      workflow: WorkflowHandle<TWorkflow>,
    ) => analyticsRef.current.startAttempt({ workflow }),
  }
}

export function useStockAdjustmentTelemetry(
  input: StockAdjustmentTelemetryInput,
): StockAdjustmentTelemetryActions {
  return createStockAdjustmentTelemetryActions(
    input,
    useStockAdjustmentAnalyticsRef(input),
  )
}
