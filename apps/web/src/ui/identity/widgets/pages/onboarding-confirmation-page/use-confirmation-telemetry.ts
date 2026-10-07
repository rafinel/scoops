import { useRef } from 'react'

import type { WorkflowHandle } from '@scoops/core/shared/interfaces'

import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'

export type ConfirmationObservation = {
  observationKey: string
  workflow?: WorkflowHandle<'onboarding'>
}

let nextConfirmationSequence = 0

export function useConfirmationTelemetry() {
  const analytics = useAnalyticsContext()
  const entryKeyRef = useRef(createConfirmationKey())
  const workflowRef = useRef<WorkflowHandle<'onboarding'> | null>(null)
  return createConfirmationTelemetryActions(analytics, entryKeyRef.current, workflowRef)
}

type Analytics = ReturnType<typeof useAnalyticsContext>
type WorkflowRef = { current: WorkflowHandle<'onboarding'> | null }

function createConfirmationTelemetryActions(
  analytics: Analytics,
  entryKey: string,
  workflowRef: WorkflowRef,
) {
  return {
    restore: (occurrenceId: string | undefined, expiresAt: number | undefined) =>
      restoreWorkflow(analytics, entryKey, workflowRef, occurrenceId, expiresAt),
    createObservation: () => createObservation(workflowRef.current),
    recordSuccess: (observation: ConfirmationObservation) =>
      recordSuccess(analytics, observation),
    recordFailure: (observation: ConfirmationObservation) =>
      recordFailure(analytics, observation),
    recordActivationFailure: (observation: ConfirmationObservation) =>
      recordActivationFailure(analytics, observation),
    endWorkflow: () => endWorkflow(analytics, workflowRef.current),
  }
}

function restoreWorkflow(
  analytics: Analytics,
  entryKey: string,
  workflowRef: WorkflowRef,
  occurrenceId: string | undefined,
  expiresAt: number | undefined,
): void {
  if (!occurrenceId || !expiresAt || expiresAt <= Date.now()) return
  workflowRef.current = startRestoredConfirmationWorkflow(
    analytics,
    entryKey,
    occurrenceId,
  )
}

function startRestoredConfirmationWorkflow(
  analytics: Analytics,
  entryKey: string,
  occurrenceId: string,
): WorkflowHandle<'onboarding'> | null {
  const workflow = analytics.startWorkflow({
    workflow: 'onboarding',
    entryKey,
    restoredOccurrenceId: occurrenceId,
  })
  return workflow.occurrenceId === occurrenceId ? workflow : null
}

function createObservation(
  workflow: WorkflowHandle<'onboarding'> | null,
): ConfirmationObservation {
  return {
    observationKey: createConfirmationKey(),
    ...(workflow ? { workflow } : {}),
  }
}

function recordSuccess(analytics: Analytics, observation: ConfirmationObservation): void {
  analytics.recordEmailConfirmation({
    observationKey: observation.observationKey,
    ...(observation.workflow ? { workflow: observation.workflow } : {}),
    outcome: 'success',
  })
}

function recordFailure(analytics: Analytics, observation: ConfirmationObservation): void {
  analytics.recordEmailConfirmation({
    observationKey: observation.observationKey,
    ...(observation.workflow ? { workflow: observation.workflow } : {}),
    outcome: 'failure',
    failureCode: 'unknown',
  })
}

function recordActivationFailure(
  analytics: Analytics,
  observation: ConfirmationObservation,
): void {
  analytics.recordAccountActivationFailure({
    observationKey: observation.observationKey,
    ...(observation.workflow ? { workflow: observation.workflow } : {}),
    failureCode: 'unknown',
  })
}

function endWorkflow(
  analytics: Analytics,
  workflow: WorkflowHandle<'onboarding'> | null,
): void {
  if (workflow) analytics.endWorkflow({ workflow })
}

function createConfirmationKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  nextConfirmationSequence += 1
  return `onboarding-confirmation-${nextConfirmationSequence}`
}
