import type { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductTelemetryEnvironment } from '#shared/interfaces/product-telemetry-environment.ts'
import type { ProductTelemetryEventName } from '#shared/interfaces/product-telemetry-event-name.ts'
import type { ProductTelemetryFailureCode } from '#shared/interfaces/product-telemetry-failure-code.ts'
import type { ProductTelemetryFieldName } from '#shared/interfaces/product-telemetry-field-name.ts'
import type { ProductTelemetryFeature } from '#shared/interfaces/product-telemetry-feature.ts'
import type { ProductTelemetryStatusClass } from '#shared/interfaces/product-telemetry-status-class.ts'
import type { ProductTelemetryWorkflow } from '#shared/interfaces/product-telemetry-workflow.ts'

type EventBase<TEvent extends ProductTelemetryEventName> = {
  event: TEvent
  schema_version: 1
  environment: ProductTelemetryEnvironment
}

type IdentityContext = {
  establishment_id: string
  role: UserProfile
}

type OptionalIdentityContext =
  | IdentityContext
  | {
      establishment_id?: never
      role?: never
    }

type OperationalWorkflow = Exclude<ProductTelemetryWorkflow, 'onboarding'>
type NonProductionOperationalWorkflow = Exclude<OperationalWorkflow, 'production'>
type TelemetryFields<TWorkflow extends ProductTelemetryWorkflow> = readonly [
  ProductTelemetryFieldName<TWorkflow>,
  ...ProductTelemetryFieldName<TWorkflow>[],
]
type SubmittedFailureCode = Exclude<ProductTelemetryFailureCode, 'insufficient_stock'>
type StockWriteOffFailureCode = ProductTelemetryFailureCode
type PreviewFailureCode = Exclude<ProductTelemetryFailureCode, 'insufficient_stock'>
type AccountActivationFailureCode =
  | 'unauthorized'
  | 'forbidden'
  | 'network_error'
  | 'server_error'
  | 'unknown'

export type ProductTelemetryEvent =
  | (EventBase<'feature_visited'> & {
      feature: ProductTelemetryFeature
    } & IdentityContext)
  | (EventBase<'onboarding_started'> & {
      workflow: 'onboarding'
      workflow_id: string
    } & OptionalIdentityContext)
  | (EventBase<'onboarding_registration_completed'> & {
      workflow: 'onboarding'
      workflow_id: string
      attempt: number
      duration_ms?: number
    } & OptionalIdentityContext)
  | (EventBase<'email_confirmation_completed'> & {
      workflow: 'onboarding'
    } & OptionalIdentityContext &
      (
        | { workflow_id: string; duration_ms?: number }
        | { workflow_id?: never; duration_ms?: never }
      ))
  | (EventBase<'workflow_started'> & {
      workflow: OperationalWorkflow
      workflow_id: string
    } & IdentityContext)
  | (EventBase<'workflow_completed'> & {
      workflow: OperationalWorkflow
      workflow_id: string
      attempt: number
      duration_ms?: number
    } & IdentityContext)
  | (EventBase<'workflow_validation_failed'> & {
      workflow: 'onboarding'
      workflow_id: string
      attempt: number
      fields: TelemetryFields<'onboarding'>
    } & OptionalIdentityContext)
  | (EventBase<'workflow_validation_failed'> & {
      workflow: NonProductionOperationalWorkflow
      workflow_id: string
      attempt: number
      fields: TelemetryFields<NonProductionOperationalWorkflow>
    } & IdentityContext)
  | (EventBase<'workflow_blocked'> & {
      workflow: 'onboarding'
      workflow_id: string
      fields: TelemetryFields<'onboarding'>
      phase: 'validation'
      failure_code: 'invalid_input'
    } & OptionalIdentityContext)
  | (EventBase<'workflow_blocked'> & {
      workflow: 'stock_write_off'
      workflow_id: string
      fields: TelemetryFields<'stock_write_off'>
      phase: 'validation'
      failure_code: 'invalid_input' | 'insufficient_stock'
    } & IdentityContext)
  | (EventBase<'workflow_blocked'> & {
      workflow: 'product_creation' | 'stock_entry'
      workflow_id: string
      fields: TelemetryFields<'product_creation' | 'stock_entry'>
      phase: 'validation'
      failure_code: 'invalid_input'
    } & IdentityContext)
  | (EventBase<'workflow_blocked'> & {
      workflow: 'production'
      workflow_id: string
      fields: TelemetryFields<'production'>
      phase: 'validation'
      failure_code: 'invalid_input'
    } & IdentityContext)
  | (EventBase<'workflow_blocked'> & {
      workflow: 'production'
      workflow_id: string
      fields: TelemetryFields<'production'>
      phase: 'preview'
      failure_code: 'insufficient_stock' | 'dependency_unavailable' | 'unknown'
    } & IdentityContext)
  | (EventBase<'workflow_failed'> & {
      workflow: 'onboarding'
      workflow_id: string
      attempt: number
      phase: 'submission'
      failure_code: SubmittedFailureCode
      status_class?: ProductTelemetryStatusClass
    } & OptionalIdentityContext)
  | (EventBase<'workflow_failed'> & {
      workflow: 'stock_write_off' | 'production'
      workflow_id: string
      attempt: number
      phase: 'submission'
      failure_code: StockWriteOffFailureCode
      status_class?: ProductTelemetryStatusClass
    } & IdentityContext)
  | (EventBase<'workflow_failed'> & {
      workflow: 'product_creation' | 'stock_entry'
      workflow_id: string
      attempt: number
      phase: 'submission'
      failure_code: SubmittedFailureCode
      status_class?: ProductTelemetryStatusClass
    } & IdentityContext)
  | (EventBase<'workflow_failed'> & {
      workflow: 'onboarding'
      phase: 'submission'
      failure_code: SubmittedFailureCode
      workflow_id?: string
      status_class?: ProductTelemetryStatusClass
    } & OptionalIdentityContext)
  | (EventBase<'workflow_failed'> & {
      workflow: 'onboarding'
      phase: 'account_activation'
      failure_code: AccountActivationFailureCode
      workflow_id?: string
      status_class?: ProductTelemetryStatusClass
    } & OptionalIdentityContext)
  | (EventBase<'workflow_failed'> & {
      workflow: 'production'
      workflow_id: string
      phase: 'preview'
      failure_code: PreviewFailureCode
      status_class?: ProductTelemetryStatusClass
    } & IdentityContext)
