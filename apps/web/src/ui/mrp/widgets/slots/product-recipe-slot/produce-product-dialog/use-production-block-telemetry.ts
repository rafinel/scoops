import { useEffect, useMemo } from 'react'

import type {
  ProductTelemetryFieldName,
  WorkflowHandle,
} from '@scoops/core/shared/interfaces'

import type { useProductionPreviewQuery } from '@/ui/mrp/hooks/use-production-preview-query'
import type { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'

type PreviewResult = ReturnType<typeof useProductionPreviewQuery>
type PreviewState = Pick<PreviewResult, 'data' | 'isError' | 'isFetching' | 'isPending'>
type AnalyticsContext = ReturnType<typeof useAnalyticsContext>

function getProductionInputField(
  mode: 'batches' | 'quantity',
): ProductTelemetryFieldName<'production'> {
  return mode === 'batches' ? 'batches' : 'quantity'
}

export function recordInvalidProductionBlock({
  analyticsRef,
  mode,
  workflowRef,
}: Pick<ProductionBlockTelemetryInput, 'analyticsRef' | 'mode' | 'workflowRef'>) {
  const workflow = workflowRef.current
  if (!workflow) return
  analyticsRef.current.recordBlock({
    workflow,
    block: getInvalidProductionBlock(getProductionInputField(mode)),
  })
}

function getPreviewBlock(
  data: PreviewResult['data'],
  isError: PreviewResult['isError'],
  isFetching: PreviewResult['isFetching'],
  isPending: PreviewResult['isPending'],
): 'unknown' | null | undefined {
  if (isPending || isFetching || isError || !data) return undefined
  return data.canProduce ? null : 'unknown'
}

type ProductionBlockTelemetryInput = {
  analyticsRef: { current: AnalyticsContext }
  hasUserInput: boolean
  isInputValid: boolean
  mode: 'batches' | 'quantity'
  open: boolean
  preview: PreviewState
  workflowRef: { current: WorkflowHandle<'production'> | undefined }
}

function getInvalidProductionBlock(field: ProductTelemetryFieldName<'production'>) {
  return {
    phase: 'validation' as const,
    failureCode: 'invalid_input' as const,
    fields: [field] as const,
  }
}

function getResolvedPreviewBlock(
  field: ProductTelemetryFieldName<'production'>,
  previewBlock: ReturnType<typeof getPreviewBlock>,
):
  | {
      phase: 'preview'
      failureCode: 'unknown'
      fields: readonly [ProductTelemetryFieldName<'production'>]
    }
  | null
  | undefined {
  if (previewBlock === undefined) return undefined
  return previewBlock
    ? { phase: 'preview' as const, failureCode: previewBlock, fields: [field] as const }
    : null
}

type ProductionBlockCandidate = {
  workflow: WorkflowHandle<'production'>
  block:
    | ReturnType<typeof getInvalidProductionBlock>
    | Exclude<ReturnType<typeof getResolvedPreviewBlock>, null | undefined>
    | null
}

type ProductionBlockPayloadInput = Pick<
  ProductionBlockTelemetryInput,
  'isInputValid' | 'mode' | 'preview'
>

function getProductionBlockWorkflow(
  open: boolean,
  hasUserInput: boolean,
  workflowRef: ProductionBlockTelemetryInput['workflowRef'],
) {
  if (!open || !hasUserInput) return undefined
  return workflowRef.current
}

function getProductionBlockPayload({
  isInputValid,
  mode,
  preview,
}: ProductionBlockPayloadInput) {
  const field = getProductionInputField(mode)
  if (!isInputValid) return getInvalidProductionBlock(field)
  return getProductionPreviewBlock(field, preview)
}

function getProductionPreviewBlock(
  field: ProductTelemetryFieldName<'production'>,
  { data, isError, isFetching, isPending }: PreviewState,
) {
  const previewBlock = getPreviewBlock(data, isError, isFetching, isPending)
  return getResolvedPreviewBlock(field, previewBlock)
}

function recordProductionBlock(
  analyticsRef: ProductionBlockTelemetryInput['analyticsRef'],
  candidate: ProductionBlockCandidate | undefined,
) {
  if (!candidate) return
  analyticsRef.current.recordBlock(candidate)
}

export function useProductionBlockTelemetry(input: ProductionBlockTelemetryInput) {
  const candidate = useProductionBlockCandidate(input)
  useEffect(
    () => recordProductionBlock(input.analyticsRef, candidate),
    [input.analyticsRef, candidate],
  )
}

function useProductionBlockCandidate({
  hasUserInput,
  isInputValid,
  mode,
  open,
  preview,
  workflowRef,
}: ProductionBlockTelemetryInput) {
  const workflow = useProductionBlockWorkflow(open, hasUserInput, workflowRef)
  const block = useProductionBlock({ isInputValid, mode, preview })
  return useMemo(() => getCandidateForBlock(workflow, block), [workflow, block])
}

function useProductionBlockWorkflow(
  open: boolean,
  hasUserInput: boolean,
  workflowRef: ProductionBlockTelemetryInput['workflowRef'],
) {
  return useMemo(
    () => getProductionBlockWorkflow(open, hasUserInput, workflowRef),
    [open, hasUserInput, workflowRef],
  )
}

function useProductionBlock(input: ProductionBlockPayloadInput) {
  const { isInputValid, mode } = input
  const preview = useProductionBlockPreview(input.preview)
  return useMemo(
    () => getProductionBlockPayload({ isInputValid, mode, preview }),
    [isInputValid, mode, preview],
  )
}

function useProductionBlockPreview({
  data,
  isError,
  isFetching,
  isPending,
}: PreviewState) {
  return useMemo(
    () => ({ data, isError, isFetching, isPending }),
    [data, isError, isFetching, isPending],
  )
}

function getCandidateForBlock(
  workflow: WorkflowHandle<'production'> | undefined,
  block: ProductionBlockCandidate['block'] | undefined,
) {
  return workflow && block !== undefined ? { workflow, block } : undefined
}
