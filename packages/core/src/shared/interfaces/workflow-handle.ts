import type { ProductTelemetryWorkflow } from '#shared/interfaces/product-telemetry-workflow.ts'

declare const workflowHandleBrand: unique symbol

export type WorkflowHandle<
  TWorkflow extends ProductTelemetryWorkflow = ProductTelemetryWorkflow,
> = {
  readonly occurrenceId: string | undefined
  readonly [workflowHandleBrand]: TWorkflow
}
