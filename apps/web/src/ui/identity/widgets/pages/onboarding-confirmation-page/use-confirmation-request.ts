import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'

import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'

import { clearOnboardingSession } from '@/ui/identity/storage/onboarding-session-storage'

import type { ConfirmationObservation } from './use-confirmation-telemetry'
import type { useConfirmationTelemetry } from './use-confirmation-telemetry'

type ConfirmationState = 'confirming' | 'success' | 'unavailable' | 'provider-error'
type OnboardingSessionSnapshot = {
  onboarding: PendingIceCreamShopOnboarding
  analyticsOccurrenceId?: string
}
type InFlightRequest = {
  token: string
  observation: ConfirmationObservation
  promise: Promise<void>
}
type ConfirmationRequestState = {
  generationRef: { current: number }
  inFlightRef: { current: InFlightRequest | null }
  successfulConfirmationRef: { current: ConfirmationObservation | null }
}
type ConfirmationTelemetry = ReturnType<typeof useConfirmationTelemetry>

type ConfirmationRequestInput = {
  confirmationToken?: string
  onboardingSession: OnboardingSessionSnapshot | undefined
  telemetry: ConfirmationTelemetry
  activateOnboardingConfirmation: () => Promise<boolean>
  confirmOnboarding: (token: string) => Promise<void>
  navigateToApp: () => Promise<unknown>
  setState: Dispatch<SetStateAction<ConfirmationState>>
  clearStoredOccurrence: () => void
}

export function useConfirmationRequest(input: ConfirmationRequestInput) {
  const requestState = useConfirmationRequestState()

  // biome-ignore lint/correctness/useExhaustiveDependencies: each confirmation URL is handled once
  useEffect(() => runConfirmationRequest(input, requestState), [input.confirmationToken])

  return createConfirmationRequestActions(requestState)
}

function useConfirmationRequestState(): ConfirmationRequestState {
  return {
    generationRef: useRef(0),
    inFlightRef: useRef<InFlightRequest | null>(null),
    successfulConfirmationRef: useRef<ConfirmationObservation | null>(null),
  }
}

function createConfirmationRequestActions(requestState: ConfirmationRequestState) {
  return {
    successfulConfirmationRef: requestState.successfulConfirmationRef,
    invalidate: () => incrementRequestGeneration(requestState.generationRef),
  }
}

function incrementRequestGeneration(generationRef: { current: number }): void {
  generationRef.current += 1
}

function runConfirmationRequest(
  input: ConfirmationRequestInput,
  requestState: ConfirmationRequestState,
): () => void {
  const token = input.confirmationToken
  if (!token) return completeUnavailableRequest(input)
  const generation = ++requestState.generationRef.current
  const request = prepareConfirmationRequest(input, token, requestState)
  return watchConfirmationRequest(input, requestState, generation, request)
}

function prepareConfirmationRequest(
  input: ConfirmationRequestInput,
  token: string,
  requestState: ConfirmationRequestState,
): InFlightRequest {
  restoreConfirmationWorkflow(input)
  return getOrCreateInFlightRequest(input, token, requestState.inFlightRef)
}

function completeUnavailableRequest(input: ConfirmationRequestInput): () => void {
  input.setState('unavailable')
  return emptyCleanup
}

function emptyCleanup(): void {}

function watchConfirmationRequest(
  input: ConfirmationRequestInput,
  requestState: ConfirmationRequestState,
  generation: number,
  request: InFlightRequest,
): () => void {
  void request.promise.then(
    () => handleConfirmationSuccess(input, generation, requestState, request.observation),
    () => handleConfirmationFailure(input, generation, requestState, request.observation),
  )
  return () => {
    requestState.generationRef.current += 1
  }
}

function restoreConfirmationWorkflow(input: ConfirmationRequestInput): void {
  input.telemetry.restore(
    input.onboardingSession?.analyticsOccurrenceId,
    input.onboardingSession?.onboarding.expiresAt.getTime(),
  )
}

function getOrCreateInFlightRequest(
  input: ConfirmationRequestInput,
  token: string,
  inFlightRef: { current: InFlightRequest | null },
): InFlightRequest {
  const existing = inFlightRef.current?.token === token ? inFlightRef.current : null
  const request = existing
    ? reuseInFlightRequest(token, existing)
    : createInFlightRequest(input, token)
  inFlightRef.current = request
  return request
}

function reuseInFlightRequest(token: string, existing: InFlightRequest): InFlightRequest {
  return { token, observation: existing.observation, promise: existing.promise }
}

function createInFlightRequest(
  input: ConfirmationRequestInput,
  token: string,
): InFlightRequest {
  return {
    token,
    observation: input.telemetry.createObservation(),
    promise: input.confirmOnboarding(token),
  }
}

async function handleConfirmationSuccess(
  input: ConfirmationRequestInput,
  generation: number,
  requestState: ConfirmationRequestState,
  observation: ConfirmationObservation,
): Promise<void> {
  if (!prepareSuccessfulConfirmation(input, generation, requestState, observation)) return
  await activateAndFinishConfirmation(input, generation, requestState, observation)
}

function prepareSuccessfulConfirmation(
  input: ConfirmationRequestInput,
  generation: number,
  requestState: ConfirmationRequestState,
  observation: ConfirmationObservation,
): boolean {
  input.telemetry.recordSuccess(observation)
  if (generation !== requestState.generationRef.current) return false
  requestState.successfulConfirmationRef.current = observation
  return true
}

async function activateAndFinishConfirmation(
  input: ConfirmationRequestInput,
  generation: number,
  requestState: ConfirmationRequestState,
  observation: ConfirmationObservation,
): Promise<void> {
  const isAuthenticated = await activateConfirmation(input, observation)
  if (!isAuthenticated) {
    input.setState('provider-error')
    return
  }
  await finishSuccessfulConfirmation(input, generation, requestState)
}

async function finishSuccessfulConfirmation(
  input: ConfirmationRequestInput,
  generation: number,
  requestState: ConfirmationRequestState,
): Promise<void> {
  input.setState('success')
  try {
    await input.navigateToApp()
  } catch {
    if (generation === requestState.generationRef.current)
      input.setState('provider-error')
  }
}

async function activateConfirmation(
  input: ConfirmationRequestInput,
  observation: ConfirmationObservation,
): Promise<boolean> {
  clearOnboardingSession()
  input.clearStoredOccurrence()
  return authenticateOnboarding(input, observation)
}

async function authenticateOnboarding(
  input: ConfirmationRequestInput,
  observation: ConfirmationObservation,
): Promise<boolean> {
  try {
    if (await input.activateOnboardingConfirmation()) return true
  } catch {
    return recordActivationFailure(input, observation)
  }
  return recordActivationFailure(input, observation)
}

function recordActivationFailure(
  input: ConfirmationRequestInput,
  observation: ConfirmationObservation,
): false {
  input.telemetry.recordActivationFailure(observation)
  return false
}

function handleConfirmationFailure(
  input: ConfirmationRequestInput,
  generation: number,
  requestState: ConfirmationRequestState,
  observation: ConfirmationObservation,
): void {
  input.telemetry.recordFailure(observation)
  if (generation === requestState.generationRef.current) input.setState('provider-error')
}
