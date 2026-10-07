import { useState } from 'react'

import type { AttemptHandle, WorkflowHandle } from '@scoops/core/shared/interfaces'
import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'

import { saveOnboardingSession } from '@/ui/identity/storage/onboarding-session-storage'
import { useAnalyticsContext } from '@/ui/shared/hooks/use-analytics-context'

const REGISTRATION_FIELDS = [
  'establishmentName',
  'managerName',
  'email',
  'password',
  'passwordConfirmation',
] as const

type RegistrationField = (typeof REGISTRATION_FIELDS)[number]
type RegistrationFieldList = readonly [RegistrationField, ...RegistrationField[]]
type OnboardingWorkflow = WorkflowHandle<'onboarding'>
type OnboardingAttempt = AttemptHandle<'onboarding'>
type Analytics = ReturnType<typeof useAnalyticsContext>
type OnboardingTelemetryState = {
  entryKey: string
  workflow: OnboardingWorkflow | null
  registrationPending: boolean
  occurrenceId: string | undefined
}

let nextEntrySequence = 0

export function useOnboardingTelemetry() {
  const analytics = useAnalyticsContext()
  const [state] = useState(createOnboardingTelemetryState)
  return createOnboardingTelemetryActions(analytics, state)
}

function createOnboardingTelemetryState(): OnboardingTelemetryState {
  return {
    entryKey: createOnboardingEntryKey(),
    workflow: null,
    registrationPending: false,
    occurrenceId: undefined,
  }
}

function createOnboardingTelemetryActions(
  analytics: Analytics,
  state: OnboardingTelemetryState,
) {
  return {
    ...createWorkflowActions(analytics, state),
    ...createRegistrationActions(analytics, state),
    restart: () => restartWorkflow(analytics, state),
  }
}

function createWorkflowActions(analytics: Analytics, state: OnboardingTelemetryState) {
  return {
    startFresh: () => startFreshWorkflow(analytics, state),
    restore: (occurrenceId: string | undefined) =>
      restoreWorkflow(analytics, state, occurrenceId),
    endIfUnregistered: () => endIfUnregistered(analytics, state),
    markRegistrationPending: () => setRegistrationPending(state),
  }
}

function createRegistrationActions(
  analytics: Analytics,
  state: OnboardingTelemetryState,
) {
  return {
    persistPending: (
      continuationToken: string,
      onboarding: PendingIceCreamShopOnboarding,
    ) => persistPendingSession(state, continuationToken, onboarding),
    startAttempt: () => startRegistrationAttempt(analytics, state),
    completeRegistration: (attempt: OnboardingAttempt | undefined, expiresAt: number) =>
      completeRegistration(analytics, attempt, expiresAt),
    recordSubmissionFailure: (attempt: OnboardingAttempt | undefined) =>
      recordSubmissionFailure(analytics, attempt),
    recordInvalidRegistration: (errors: Partial<Record<RegistrationField, unknown>>) =>
      recordInvalidRegistration(analytics, state, errors),
  }
}

function setRegistrationPending(state: OnboardingTelemetryState): void {
  state.registrationPending = true
}

function startFreshWorkflow(analytics: Analytics, state: OnboardingTelemetryState): void {
  const workflow = analytics.startWorkflow({
    workflow: 'onboarding',
    entryKey: state.entryKey,
  })
  state.workflow = workflow
  state.occurrenceId = workflow.occurrenceId
}

function restoreWorkflow(
  analytics: Analytics,
  state: OnboardingTelemetryState,
  occurrenceId: string | undefined,
): void {
  if (!occurrenceId) return
  const workflow = startRestoredWorkflow(analytics, state.entryKey, occurrenceId)
  state.workflow = workflow
  state.occurrenceId = workflow.occurrenceId === occurrenceId ? occurrenceId : undefined
}

function startRestoredWorkflow(
  analytics: Analytics,
  entryKey: string,
  occurrenceId: string,
): OnboardingWorkflow {
  return analytics.startWorkflow({
    workflow: 'onboarding',
    entryKey,
    restoredOccurrenceId: occurrenceId,
  })
}

function endIfUnregistered(analytics: Analytics, state: OnboardingTelemetryState): void {
  if (!state.registrationPending && state.workflow) {
    analytics.endWorkflow({ workflow: state.workflow })
  }
}

function persistPendingSession(
  state: OnboardingTelemetryState,
  continuationToken: string,
  onboarding: PendingIceCreamShopOnboarding,
): void {
  saveOnboardingSession({
    version: 1,
    continuationToken,
    onboarding,
    ...(state.occurrenceId ? { analyticsOccurrenceId: state.occurrenceId } : {}),
  })
}

function startRegistrationAttempt(
  analytics: Analytics,
  state: OnboardingTelemetryState,
): OnboardingAttempt | undefined {
  return state.workflow ? analytics.startAttempt({ workflow: state.workflow }) : undefined
}

function completeRegistration(
  analytics: Analytics,
  attempt: OnboardingAttempt | undefined,
  expiresAt: number,
): void {
  if (attempt) analytics.completeWorkflow({ attempt, onboardingExpiresAt: expiresAt })
}

function recordSubmissionFailure(
  analytics: Analytics,
  attempt: OnboardingAttempt | undefined,
): void {
  if (attempt) {
    analytics.recordFailure({ attempt, phase: 'submission', failureCode: 'unknown' })
  }
}

function recordInvalidRegistration(
  analytics: Analytics,
  state: OnboardingTelemetryState,
  errors: Partial<Record<RegistrationField, unknown>>,
): void {
  const fields = getRegistrationValidationFields(errors)
  if (!state.workflow || !fields) return
  analytics.recordValidationFailure({
    attempt: analytics.startAttempt({ workflow: state.workflow }),
    fields,
  })
}

function getRegistrationValidationFields(
  errors: Partial<Record<RegistrationField, unknown>>,
): RegistrationFieldList | undefined {
  const [firstField, ...remainingFields] = REGISTRATION_FIELDS.filter(
    (field) => errors[field] !== undefined,
  )
  return firstField
    ? ([firstField, ...remainingFields] as RegistrationFieldList)
    : undefined
}

function restartWorkflow(analytics: Analytics, state: OnboardingTelemetryState): void {
  if (state.workflow) analytics.endWorkflow({ workflow: state.workflow })
  resetOnboardingWorkflow(state)
  startFreshWorkflow(analytics, state)
}

function resetOnboardingWorkflow(state: OnboardingTelemetryState): void {
  state.workflow = null
  state.occurrenceId = undefined
  state.registrationPending = false
  state.entryKey = createOnboardingEntryKey()
}

function createOnboardingEntryKey(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  nextEntrySequence += 1
  return `onboarding-entry-${nextEntrySequence}`
}
