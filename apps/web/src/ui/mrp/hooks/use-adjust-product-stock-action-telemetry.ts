import { useQueryClient } from '@tanstack/react-query'

import type {
  AdjustProductStockInput,
  StockBalance,
} from '@scoops/core/mrp/domain/structures'
import type { AttemptHandle } from '@scoops/core/shared/interfaces'

import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'
import type { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { mrpQueryKeys } from './mrp-query-keys'
import {
  getMrpActionTelemetryFailure,
  type MrpActionTelemetryFailure,
} from './mrp-action-telemetry-failure'

type StockAttempt = AttemptHandle<'stock_entry'> | AttemptHandle<'stock_write_off'>
type AnalyticsContext = ReturnType<typeof useAnalyticsContext>
type StockEntryInput = Omit<AdjustProductStockInput, 'type'> & { type: 'entry' }
type StockWriteOffInput = Omit<AdjustProductStockInput, 'type'> & { type: 'write-off' }

type StockAdjustmentMutationVariables = {
  failure?: MrpActionTelemetryFailure
  responseSucceeded: boolean
} & (
  | {
      attempt?: AttemptHandle<'stock_entry'>
      input: StockEntryInput
    }
  | {
      attempt?: AttemptHandle<'stock_write_off'>
      input: StockWriteOffInput
    }
)

function createStockMutationOptions(
  productId: string,
  analytics: ReturnType<typeof useAnalyticsContext>,
  mrpService: ReturnType<typeof useRestContext>['mrpService'],
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return {
    mutationFn: (variables: StockAdjustmentMutationVariables) =>
      registerStockAdjustment(productId, mrpService, variables),
    onSuccess: (
      _transaction: StockBalance,
      variables: StockAdjustmentMutationVariables,
    ) => completeStockAdjustment(productId, analytics, queryClient, variables),
    onError: (_error: unknown, variables: StockAdjustmentMutationVariables) =>
      reportStockAdjustmentFailure(analytics, variables),
  }
}

export function useStockAdjustmentMutationOptions(
  productId: string,
  mrpService: ReturnType<typeof useRestContext>['mrpService'],
) {
  return createStockMutationOptions(
    productId,
    useAnalyticsContext(),
    mrpService,
    useQueryClient(),
  )
}

async function registerStockAdjustment(
  productId: string,
  mrpService: ReturnType<typeof useRestContext>['mrpService'],
  variables: StockAdjustmentMutationVariables,
) {
  const response = await mrpService.adjustProductStock(productId, variables.input)
  return response.isFailure
    ? throwStockAdjustmentFailure(response, variables)
    : markStockAdjustmentSuccess(response.body, variables)
}

function throwStockAdjustmentFailure(
  response: Awaited<
    ReturnType<ReturnType<typeof useRestContext>['mrpService']['adjustProductStock']>
  >,
  variables: StockAdjustmentMutationVariables,
): never {
  variables.failure = getMrpActionTelemetryFailure(response.statusCode, true)
  return response.throwError()
}

function markStockAdjustmentSuccess(
  body: StockBalance,
  variables: StockAdjustmentMutationVariables,
) {
  variables.responseSucceeded = true
  return body
}

async function completeStockAdjustment(
  productId: string,
  analytics: ReturnType<typeof useAnalyticsContext>,
  queryClient: ReturnType<typeof useQueryClient>,
  variables: StockAdjustmentMutationVariables,
) {
  if (variables.attempt) analytics.completeWorkflow({ attempt: variables.attempt })
  await queryClient.invalidateQueries({
    queryKey: mrpQueryKeys.productStock(productId),
  })
}

function reportStockAdjustmentFailure(
  analytics: AnalyticsContext,
  variables: StockAdjustmentMutationVariables,
) {
  if (!variables.attempt || variables.responseSucceeded) return
  const failure = variables.failure ?? { failureCode: 'unknown' as const }
  recordStockFailureByType(analytics, variables.input.type, variables.attempt, failure)
}

function recordStockFailureByType(
  analytics: AnalyticsContext,
  type: AdjustProductStockInput['type'],
  attempt: StockAttempt,
  failure: MrpActionTelemetryFailure | { failureCode: 'unknown' },
) {
  return type === 'entry'
    ? recordStockEntryFailure(analytics, attempt as AttemptHandle<'stock_entry'>, failure)
    : recordStockWriteOffFailure(
        analytics,
        attempt as AttemptHandle<'stock_write_off'>,
        failure,
      )
}

function recordStockEntryFailure(
  analytics: ReturnType<typeof useAnalyticsContext>,
  attempt: AttemptHandle<'stock_entry'>,
  failure: MrpActionTelemetryFailure | { failureCode: 'unknown' },
) {
  analytics.recordFailure({ attempt, phase: 'submission', ...failure })
}

function recordStockWriteOffFailure(
  analytics: ReturnType<typeof useAnalyticsContext>,
  attempt: AttemptHandle<'stock_write_off'>,
  failure: MrpActionTelemetryFailure | { failureCode: 'unknown' },
) {
  analytics.recordFailure({ attempt, phase: 'submission', ...failure })
}

type StockAdjustmentDispatcher = {
  (
    input: AdjustProductStockInput & { type: 'entry' },
    attempt?: AttemptHandle<'stock_entry'>,
  ): Promise<StockBalance>
  (
    input: AdjustProductStockInput & { type: 'write-off' },
    attempt?: AttemptHandle<'stock_write_off'>,
  ): Promise<StockBalance>
}

export function createStockAdjustmentDispatcher(
  mutateAsync: (variables: StockAdjustmentMutationVariables) => Promise<StockBalance>,
): StockAdjustmentDispatcher {
  return ((input: StockEntryInput | StockWriteOffInput, attempt?: StockAttempt) =>
    mutateAsync({
      attempt,
      input,
      responseSucceeded: false,
    } as StockAdjustmentMutationVariables)) as StockAdjustmentDispatcher
}
