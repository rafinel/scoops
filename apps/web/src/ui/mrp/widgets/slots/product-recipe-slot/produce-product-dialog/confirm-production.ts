import { productionSchema } from '@scoops/validation'

import type { useRegisterProductionAction } from '@/ui/mrp/hooks/use-register-production-action'
import type { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'
import type { useProductionWorkflow } from './use-production-workflow'
import { recordInvalidProductionBlock } from './use-production-block-telemetry'

type ProductionWorkflowState = ReturnType<typeof useProductionWorkflow>
type ProductionAnalytics = ReturnType<typeof useAnalyticsContext>

type ProductionConfirmationInput = {
  analyticsRef: { current: ProductionAnalytics }
  hasUserInput: boolean
  isInputValid: boolean
  mode: 'batches' | 'quantity'
  onSuccess: () => void
  previewCanProduce: boolean
  production: ReturnType<typeof useRegisterProductionAction>
  quantity: number
  setError: (error: string | null) => void
  validationError: string | null
  workflowRef: ProductionWorkflowState['workflowRef']
}

function canConfirmProduction({
  isInputValid,
  previewCanProduce,
  quantity,
  setError,
  validationError,
}: Pick<
  ProductionConfirmationInput,
  'isInputValid' | 'previewCanProduce' | 'quantity' | 'setError' | 'validationError'
>) {
  if (!isInputValid) {
    setError(validationError)
    return false
  }
  productionSchema.parse({ quantity })
  return previewCanProduce
}

function startProductionAttempt({
  analyticsRef,
  workflowRef,
}: Pick<ProductionConfirmationInput, 'analyticsRef' | 'workflowRef'>) {
  const workflow = workflowRef.current
  return workflow ? analyticsRef.current.startAttempt({ workflow }) : undefined
}

function getProductionErrorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Não foi possível registrar a produção.'
}

function handleProductionFailure(
  input: ProductionConfirmationInput,
  cause: unknown,
  hasDispatchedRequest: boolean,
) {
  if (!hasDispatchedRequest && input.hasUserInput) recordInvalidProductionBlock(input)
  input.setError(getProductionErrorMessage(cause))
}

async function dispatchProduction(
  input: ProductionConfirmationInput,
  markDispatched: () => void,
) {
  const attempt = startProductionAttempt(input)
  markDispatched()
  await input.production.registerProduction({ quantity: input.quantity }, attempt)
  input.onSuccess()
}

export async function confirmProduction(input: ProductionConfirmationInput) {
  let hasDispatchedRequest = false
  try {
    if (!canConfirmProduction(input)) return
    await dispatchProduction(input, () => (hasDispatchedRequest = true))
  } catch (cause) {
    handleProductionFailure(input, cause, hasDispatchedRequest)
  }
}
