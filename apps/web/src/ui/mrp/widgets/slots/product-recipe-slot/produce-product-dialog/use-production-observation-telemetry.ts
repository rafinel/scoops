import type { WorkflowHandle } from '@scoops/core/shared/interfaces'

import type { useProductionPreviewQuery } from '@/ui/mrp/hooks/use-production-preview-query'
import type { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'
import type { useRegisterProductionAction } from '@/ui/mrp/hooks/use-register-production-action'
import { confirmProduction } from './confirm-production'
import { useProductionBlockTelemetry } from './use-production-block-telemetry'
import { useProductionPreviewTelemetry } from './use-production-preview-telemetry'
import { useProductionWorkflow } from './use-production-workflow'

type AnalyticsContext = ReturnType<typeof useAnalyticsContext>
type PreviewResult = ReturnType<typeof useProductionPreviewQuery>
type ProductionAction = ReturnType<typeof useRegisterProductionAction>

export function useProductionObservationTelemetry(input: {
  analyticsRef: { current: AnalyticsContext }
  entryKey: string | undefined
  hasUserInput: boolean
  isInputValid: boolean
  mode: 'batches' | 'quantity'
  open: boolean
  preview: PreviewResult
  quantity: number
  workflowRef: { current: WorkflowHandle<'production'> | undefined }
}) {
  useProductionPreviewTelemetry(input)
  useProductionBlockTelemetry(input)
}

export function useProductionDialogTelemetry(input: {
  hasUserInput: boolean
  isInputValid: boolean
  mode: 'batches' | 'quantity'
  onError: (error: string | null) => void
  open: boolean
  preview: PreviewResult
  production: ProductionAction
  quantity: number
  validationError: string | null
}) {
  const state = Object.assign({}, input, useProductionWorkflow(input.open), {
    previewCanProduce: Boolean(input.preview.data?.canProduce),
    setError: input.onError,
  })
  useProductionObservationTelemetry(state)
  return { handleConfirm: createProductionConfirmationHandler(state) }
}

function createProductionConfirmationHandler(
  state: Omit<Parameters<typeof confirmProduction>[0], 'onSuccess'>,
) {
  return (onSuccess: () => void) => confirmProduction({ ...state, onSuccess })
}
