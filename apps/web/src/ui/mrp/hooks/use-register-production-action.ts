import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { mrpQueryKeys } from './mrp-query-keys'
import { getMrpActionTelemetryFailure } from './mrp-action-telemetry-failure'
export const useRegisterProductionAction = (productId: string) => {
  const analytics = useAnalyticsContext()
  const { mrpService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation(
    createProductionMutationOptions(productId, analytics, mrpService, queryClient),
  )
  return {
    error: mutation.error,
    isPending: mutation.isPending,
    registerProduction: (input: ProductionRequestInput, attempt?: ProductionAttempt) =>
      mutation.mutateAsync({ attempt, input, responseSucceeded: false }),
  }
}

type ProductionRequestInput =
  import('@scoops/core/mrp/domain/structures').ProductionRequest
type ProductionAttempt =
  import('@scoops/core/shared/interfaces').AttemptHandle<'production'>

type ProductionMutationVariables = {
  attempt?: ProductionAttempt
  failure?: ReturnType<typeof getMrpActionTelemetryFailure>
  input: ProductionRequestInput
  responseSucceeded: boolean
}

function createProductionMutationOptions(
  productId: string,
  analytics: ReturnType<typeof useAnalyticsContext>,
  mrpService: ReturnType<typeof useRestContext>['mrpService'],
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return {
    mutationFn: (variables: ProductionMutationVariables) =>
      registerProductionRequest(productId, mrpService, variables),
    onSuccess: (_production: unknown, variables: ProductionMutationVariables) =>
      completeProduction(analytics, queryClient, productId, variables),
    onError: (_error: unknown, variables: ProductionMutationVariables) =>
      reportProductionFailure(analytics, variables),
  }
}

async function registerProductionRequest(
  productId: string,
  mrpService: ReturnType<typeof useRestContext>['mrpService'],
  variables: ProductionMutationVariables,
) {
  const response = await mrpService.registerProduction(productId, variables.input)
  return resolveProductionResponse(response, variables)
}

function resolveProductionResponse(
  response: Awaited<
    ReturnType<ReturnType<typeof useRestContext>['mrpService']['registerProduction']>
  >,
  variables: ProductionMutationVariables,
) {
  if (response.isFailure) {
    variables.failure = getMrpActionTelemetryFailure(response.statusCode, true)
    return response.throwError()
  }
  variables.responseSucceeded = true
  return response.body
}

async function completeProduction(
  analytics: ReturnType<typeof useAnalyticsContext>,
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string,
  variables: ProductionMutationVariables,
) {
  if (variables.attempt) analytics.completeWorkflow({ attempt: variables.attempt })
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: mrpQueryKeys.productRecipe(productId) }),
    queryClient.invalidateQueries({ queryKey: mrpQueryKeys.productStock(productId) }),
  ])
}

function reportProductionFailure(
  analytics: ReturnType<typeof useAnalyticsContext>,
  variables: ProductionMutationVariables,
) {
  if (!variables.attempt || variables.responseSucceeded) return
  analytics.recordFailure({
    attempt: variables.attempt,
    phase: 'submission',
    ...(variables.failure ?? { failureCode: 'unknown' as const }),
  })
}
