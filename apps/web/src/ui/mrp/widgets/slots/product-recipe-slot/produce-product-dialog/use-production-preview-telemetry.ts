import { useEffect, useRef } from 'react'

import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '@scoops/core/shared/domain/errors'
import type { WorkflowHandle } from '@scoops/core/shared/interfaces'

import type { useProductionPreviewQuery } from '@/ui/mrp/hooks/use-production-preview-query'
import type { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'

type PreviewObservation = {
  entryKey?: string
  isFetching: boolean
  observationKey?: string
  quantity: number
}
type AnalyticsContext = ReturnType<typeof useAnalyticsContext>
type PreviewResult = ReturnType<typeof useProductionPreviewQuery>
type PreviewFailure = {
  failureCode: 'invalid_input' | 'dependency_unavailable' | 'conflict' | 'unknown'
  statusClass?: '4xx'
}

function getPreviewFailure(error: unknown): PreviewFailure {
  const failureCode = getPreviewFailureCode(error)
  return {
    failureCode,
    ...(failureCode === 'unknown' ? {} : { statusClass: '4xx' }),
  }
}

function getPreviewFailureCode(error: unknown): PreviewFailure['failureCode'] {
  if (error instanceof BadRequestError) return 'invalid_input'
  if (error instanceof ConflictError) return 'conflict'
  if (error instanceof NotFoundError) return 'dependency_unavailable'
  return 'unknown'
}

function createPreviewObservationKey(entryKey: string, requestNumber: number) {
  return `${entryKey}:preview:${requestNumber}`
}

function createPreviewObservation(
  entryKey: string,
  quantity: number,
  requestNumber: number,
): PreviewObservation {
  return {
    entryKey,
    isFetching: true,
    observationKey: createPreviewObservationKey(entryKey, requestNumber),
    quantity,
  }
}

function isSameFetchingPreview(
  current: PreviewObservation | undefined,
  quantity: number,
) {
  return Boolean(current?.isFetching && current.quantity === quantity)
}

function updatePreviewObservation({
  entryKey,
  observationRef,
  open,
  preview,
  quantity,
  requestCount,
}: {
  entryKey: string | undefined
  observationRef: { current: PreviewObservation | undefined }
  open: boolean
  preview: PreviewResult
  quantity: number
  requestCount: { current: number }
}) {
  if (!preview.isFetching) return finishPreviewObservation(observationRef)
  if (!open) return updateClosedPreviewObservation(observationRef, quantity)
  if (entryKey)
    updateActivePreviewObservation(entryKey, quantity, observationRef, requestCount)
}

function updateClosedPreviewObservation(
  observationRef: { current: PreviewObservation | undefined },
  quantity: number,
) {
  const current = observationRef.current
  if (!current?.isFetching || current.quantity !== quantity) {
    observationRef.current = { isFetching: true, quantity }
  }
}

function finishPreviewObservation(observationRef: {
  current: PreviewObservation | undefined
}) {
  if (observationRef.current?.isFetching) {
    observationRef.current = { ...observationRef.current, isFetching: false }
  }
}

function updateActivePreviewObservation(
  entryKey: string,
  quantity: number,
  observationRef: { current: PreviewObservation | undefined },
  requestCount: { current: number },
) {
  if (isSameFetchingPreview(observationRef.current, quantity)) return
  requestCount.current += 1
  observationRef.current = createPreviewObservation(
    entryKey,
    quantity,
    requestCount.current,
  )
}

type PreviewFailureTarget = {
  workflow: WorkflowHandle<'production'>
  observationKey: string
}

function getPreviewFailureTarget(
  input: PreviewFailureReportingInput,
): PreviewFailureTarget | undefined {
  const workflow = input.workflowRef.current
  const observationKey = input.observationRef.current?.observationKey
  return workflow && observationKey && isFailedPreviewCurrent(input)
    ? { workflow, observationKey }
    : undefined
}

function reportFailedPreview(input: PreviewFailureReportingInput) {
  const target = getPreviewFailureTarget(input)
  if (!target) return
  input.lastFailedObservationKey.current = target.observationKey
  recordPreviewFailure(input, target.workflow, target.observationKey)
}

function recordPreviewFailure(
  input: PreviewFailureReportingInput,
  workflow: WorkflowHandle<'production'>,
  observationKey: string,
) {
  input.analyticsRef.current.recordFailure({
    workflow,
    observationKey,
    phase: 'preview',
    ...getPreviewFailure(input.preview.error),
  })
}

type ProductionPreviewTelemetryInput = {
  analyticsRef: { current: AnalyticsContext }
  entryKey: string | undefined
  open: boolean
  preview: PreviewResult
  quantity: number
  workflowRef: { current: WorkflowHandle<'production'> | undefined }
}

type PreviewFailureReportingInput = Omit<ProductionPreviewTelemetryInput, 'preview'> & {
  lastFailedObservationKey: { current: string | undefined }
  observationRef: { current: PreviewObservation | undefined }
  preview: Pick<PreviewResult, 'error' | 'isError' | 'isFetching'>
}

function usePreviewFailureReporting(input: PreviewFailureReportingInput) {
  useEffect(() => reportFailedPreview(input), [input])
}

function usePreviewTrackingRefs() {
  return {
    requestCount: useRef(0),
    observationRef: useRef<PreviewObservation | undefined>(undefined),
    lastFailedObservationKey: useRef<string | undefined>(undefined),
  }
}

export function useProductionPreviewTelemetry(input: ProductionPreviewTelemetryInput) {
  const state = { ...input, ...usePreviewTrackingRefs() }
  updatePreviewObservation(state)
  usePreviewFailureReporting(state)
}

function isActivePreviewFailure(input: PreviewFailureReportingInput) {
  return (
    input.open &&
    Boolean(input.workflowRef.current) &&
    input.preview.isError &&
    !input.preview.isFetching
  )
}

function matchesFailedPreviewObservation({
  entryKey,
  quantity,
  observationRef,
}: PreviewFailureReportingInput) {
  const observation = observationRef.current
  return (
    Boolean(observation?.observationKey) &&
    observation?.entryKey === entryKey &&
    observation?.quantity === quantity
  )
}

function isFailedPreviewCurrent(input: PreviewFailureReportingInput) {
  return (
    isActivePreviewFailure(input) &&
    matchesFailedPreviewObservation(input) &&
    input.lastFailedObservationKey.current !==
      input.observationRef.current?.observationKey
  )
}
