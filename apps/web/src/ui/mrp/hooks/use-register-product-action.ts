import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { getMrpActionTelemetryFailure } from './mrp-action-telemetry-failure'

export function useRegisterProductAction() {
  const analytics = useAnalyticsContext()
  const { mrpService } = useRestContext()
  const { isPending, mutateAsync } = useMutation(
    createProductMutationOptions(analytics, mrpService, useQueryClient()),
  )
  return {
    isPending,
    registerProduct: createProductRegistrationDispatcher(mutateAsync),
  }
}

type ProductRegistrationInput =
  import('@scoops/core/mrp/domain/structures').RegisterProductInput
type ProductCreationAttempt =
  import('@scoops/core/shared/interfaces').AttemptHandle<'product_creation'>

type ProductMutationVariables = {
  attempt?: ProductCreationAttempt
  failure?: ReturnType<typeof getMrpActionTelemetryFailure>
  input: ProductRegistrationInput
  responseSucceeded: boolean
}

type ProductRegistrationResult = Awaited<
  ReturnType<ReturnType<typeof useRestContext>['mrpService']['registerProduct']>
>['body']
type ProductMutateAsync = (
  variables: ProductMutationVariables,
) => Promise<ProductRegistrationResult>

function createProductRegistrationDispatcher(mutateAsync: ProductMutateAsync) {
  return (input: ProductRegistrationInput, attempt?: ProductCreationAttempt) =>
    mutateAsync({ attempt, input, responseSucceeded: false })
}

function createProductMutationOptions(
  analytics: ReturnType<typeof useAnalyticsContext>,
  mrpService: ReturnType<typeof useRestContext>['mrpService'],
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return {
    mutationFn: (variables: ProductMutationVariables) =>
      registerProductRequest(mrpService, variables),
    onSuccess: (_product: unknown, variables: ProductMutationVariables) =>
      completeProductRegistration(analytics, queryClient, variables),
    onError: (_error: unknown, variables: ProductMutationVariables) =>
      reportProductRegistrationFailure(analytics, variables),
  }
}

async function registerProductRequest(
  mrpService: ReturnType<typeof useRestContext>['mrpService'],
  variables: ProductMutationVariables,
) {
  const response = await mrpService.registerProduct(variables.input)
  return resolveProductRegistration(response, variables)
}

function resolveProductRegistration(
  response: Awaited<
    ReturnType<ReturnType<typeof useRestContext>['mrpService']['registerProduct']>
  >,
  variables: ProductMutationVariables,
) {
  if (response.isFailure) {
    variables.failure = getMrpActionTelemetryFailure(response.statusCode)
    return response.throwError()
  }
  variables.responseSucceeded = true
  return response.body
}

async function completeProductRegistration(
  analytics: ReturnType<typeof useAnalyticsContext>,
  queryClient: ReturnType<typeof useQueryClient>,
  variables: ProductMutationVariables,
) {
  if (variables.attempt) analytics.completeWorkflow({ attempt: variables.attempt })
  await queryClient.invalidateQueries({ queryKey: ['mrp', 'products'] })
}

function reportProductRegistrationFailure(
  analytics: ReturnType<typeof useAnalyticsContext>,
  variables: ProductMutationVariables,
) {
  if (!variables.attempt || variables.responseSucceeded) return
  analytics.recordFailure({
    attempt: variables.attempt,
    phase: 'submission',
    ...(variables.failure ?? { failureCode: 'unknown' as const }),
  })
}
