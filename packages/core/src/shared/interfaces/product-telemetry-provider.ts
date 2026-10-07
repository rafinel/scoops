import type { AttemptHandle } from '#shared/interfaces/attempt-handle.ts'
import type { ProductTelemetryFailureCode } from '#shared/interfaces/product-telemetry-failure-code.ts'
import type { ProductTelemetryFieldName } from '#shared/interfaces/product-telemetry-field-name.ts'
import type { ProductTelemetryFeature } from '#shared/interfaces/product-telemetry-feature.ts'
import type { ProductTelemetryStatusClass } from '#shared/interfaces/product-telemetry-status-class.ts'
import type { ProductTelemetryWorkflow } from '#shared/interfaces/product-telemetry-workflow.ts'
import type { WorkflowHandle } from '#shared/interfaces/workflow-handle.ts'

type OperationalWorkflow = Exclude<ProductTelemetryWorkflow, 'onboarding'>
type AttemptableWorkflow = Exclude<ProductTelemetryWorkflow, 'production'>
type Fields<TWorkflow extends ProductTelemetryWorkflow> = readonly [
  ProductTelemetryFieldName<TWorkflow>,
  ...ProductTelemetryFieldName<TWorkflow>[],
]
type SubmissionFailureCode<TWorkflow extends ProductTelemetryWorkflow> = TWorkflow extends
  | 'stock_write_off'
  | 'production'
  ? ProductTelemetryFailureCode
  : Exclude<ProductTelemetryFailureCode, 'insufficient_stock'>
type WorkflowStartInput<TWorkflow extends ProductTelemetryWorkflow> =
  TWorkflow extends 'onboarding'
    ? {
        workflow: TWorkflow
        entryKey: string
        restoredOccurrenceId?: string
      }
    : {
        workflow: TWorkflow
        entryKey: string
        restoredOccurrenceId?: never
      }
type ValidationFailureInput<TWorkflow extends AttemptableWorkflow> = {
  attempt: AttemptHandle<TWorkflow>
  fields: Fields<TWorkflow>
}
type BlockInput<TWorkflow extends ProductTelemetryWorkflow> =
  TWorkflow extends 'production'
    ?
        | {
            phase: 'validation'
            failureCode: 'invalid_input'
            fields: Fields<TWorkflow>
          }
        | {
            phase: 'preview'
            failureCode: 'insufficient_stock' | 'dependency_unavailable' | 'unknown'
            fields: Fields<TWorkflow>
          }
    : TWorkflow extends 'stock_write_off'
      ? {
          phase: 'validation'
          failureCode: 'invalid_input' | 'insufficient_stock'
          fields: Fields<TWorkflow>
        }
      : {
          phase: 'validation'
          failureCode: 'invalid_input'
          fields: Fields<TWorkflow>
        }
type SubmissionFailureInput<TWorkflow extends ProductTelemetryWorkflow> =
  TWorkflow extends ProductTelemetryWorkflow
    ? {
        attempt: AttemptHandle<TWorkflow>
        phase: 'submission'
        failureCode: SubmissionFailureCode<TWorkflow>
        statusClass?: ProductTelemetryStatusClass
      }
    : never
type ConfirmationFailureCode = Exclude<ProductTelemetryFailureCode, 'insufficient_stock'>
type PreviewFailureInput = {
  workflow: WorkflowHandle<'production'>
  observationKey: string
  phase: 'preview'
  failureCode: Exclude<ProductTelemetryFailureCode, 'insufficient_stock'>
  statusClass?: ProductTelemetryStatusClass
}
type ConfirmationInput = {
  observationKey: string
  workflow?: WorkflowHandle<'onboarding'>
} & (
  | {
      outcome: 'success'
      failureCode?: never
      statusClass?: never
    }
  | {
      outcome: 'failure'
      failureCode: ConfirmationFailureCode
      statusClass?: ProductTelemetryStatusClass
    }
)
type AccountActivationFailureInput = {
  observationKey: string
  workflow?: WorkflowHandle<'onboarding'>
  failureCode: 'unauthorized' | 'forbidden' | 'network_error' | 'server_error' | 'unknown'
  statusClass?: ProductTelemetryStatusClass
}

export interface ProductTelemetryProvider {
  startWorkflow<TWorkflow extends ProductTelemetryWorkflow>(
    input: WorkflowStartInput<TWorkflow>,
  ): WorkflowHandle<TWorkflow>
  startAttempt<TWorkflow extends ProductTelemetryWorkflow>(input: {
    workflow: WorkflowHandle<TWorkflow>
  }): AttemptHandle<TWorkflow>
  recordValidationFailure<TWorkflow extends AttemptableWorkflow>(
    input: ValidationFailureInput<TWorkflow>,
  ): void
  recordBlock<TWorkflow extends ProductTelemetryWorkflow>(input: {
    workflow: WorkflowHandle<TWorkflow>
    block: BlockInput<TWorkflow> | null
  }): void
  recordFailure(
    input: SubmissionFailureInput<ProductTelemetryWorkflow> | PreviewFailureInput,
  ): void
  completeWorkflow<TWorkflow extends OperationalWorkflow>(input: {
    attempt: AttemptHandle<TWorkflow>
  }): void
  completeWorkflow(input: {
    attempt: AttemptHandle<'onboarding'>
    onboardingExpiresAt: number
  }): void
  endWorkflow<TWorkflow extends ProductTelemetryWorkflow>(input: {
    workflow: WorkflowHandle<TWorkflow>
  }): void
  recordEmailConfirmation(input: ConfirmationInput): void
  recordAccountActivationFailure(input: AccountActivationFailureInput): void
  recordFeatureVisit(input: { feature: ProductTelemetryFeature; entryKey: string }): void
}
