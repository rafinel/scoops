import type { ProductTelemetryWorkflow } from '#shared/interfaces/product-telemetry-workflow.ts'

declare const attemptHandleBrand: unique symbol

export type AttemptHandle<
  TWorkflow extends ProductTelemetryWorkflow = ProductTelemetryWorkflow,
> = {
  readonly [attemptHandleBrand]: TWorkflow
}
