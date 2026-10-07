import { useState, type Dispatch, type SetStateAction } from 'react'

import type { PendingIceCreamShopOnboarding } from '@scoops/core/identity/domain/structures'

import { useConfirmIceCreamShopOnboardingAction } from '@/ui/identity/hooks/use-confirm-ice-cream-shop-onboarding-action'
import {
  clearOnboardingSession,
  loadOnboardingSession,
  type StoredOnboardingSession,
} from '@/ui/identity/storage/onboarding-session-storage'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import type { ConfirmationObservation } from './use-confirmation-telemetry'
import { useConfirmationTelemetry } from './use-confirmation-telemetry'
import { useConfirmationRequest } from './use-confirmation-request'

type ConfirmationState = 'confirming' | 'success' | 'unavailable' | 'provider-error'
type ConfirmationStateSetter = Dispatch<SetStateAction<ConfirmationState>>
type ConfirmationTelemetry = ReturnType<typeof useConfirmationTelemetry>
type ConfirmationPageActionsInput = {
  activateOnboardingConfirmation: () => Promise<boolean>
  completeOnboardingConfirmation: () => Promise<void>
  telemetry: ConfirmationTelemetry
  successfulConfirmationRef: { current: ConfirmationObservation | null }
  invalidate: () => void
  navigateToApp: () => Promise<unknown>
  navigateToOnboarding: () => Promise<unknown>
}

export function useOnboardingConfirmationPage(confirmationToken?: string) {
  const [state, setState, validToken] = useConfirmationPageState(confirmationToken)
  const dependencies = useConfirmationPageDependencies()
  const pageActions = useConfirmationPageActions(validToken, setState, dependencies)
  return createConfirmationPageResult(state, dependencies, pageActions)
}

function useConfirmationPageActions(
  token: string | undefined,
  setState: ConfirmationStateSetter,
  dependencies: ReturnType<typeof useConfirmationPageDependencies>,
) {
  const confirmation = usePageConfirmation(token, setState, dependencies)
  return createPageActions(
    dependencies.auth,
    dependencies.navigation,
    dependencies.telemetry,
    confirmation,
  )
}

function useConfirmationPageState(confirmationToken?: string) {
  const validToken = isValidConfirmationToken(confirmationToken)
    ? confirmationToken
    : undefined
  const [state, setState] = useState<ConfirmationState>(
    validToken ? 'confirming' : 'unavailable',
  )
  return [state, setState, validToken] as const
}

function createConfirmationPageResult(
  state: ConfirmationState,
  { action, onboardingSession }: ReturnType<typeof useConfirmationPageDependencies>,
  pageActions: ReturnType<typeof createPageActions>,
) {
  return {
    state,
    error: action.error,
    onboarding: onboardingSession.value?.onboarding,
    isPending: action.isPending,
    ...pageActions,
  }
}

function isValidConfirmationToken(value?: string): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}

function useConfirmationPageDependencies() {
  return {
    telemetry: useConfirmationTelemetry(),
    auth: useAuthContext(),
    navigation: useNavigation(),
    action: useConfirmIceCreamShopOnboardingAction(),
    onboardingSession: useConfirmationOnboardingSession(),
  }
}

function usePageConfirmation(
  confirmationToken: string | undefined,
  setState: ConfirmationStateSetter,
  dependencies: ReturnType<typeof useConfirmationPageDependencies>,
) {
  return useConfirmationRequest({
    confirmationToken,
    ...confirmationRequestDependencies(dependencies),
    setState,
  })
}

function confirmationRequestDependencies({
  onboardingSession,
  telemetry,
  auth,
  action,
  navigation,
}: ReturnType<typeof useConfirmationPageDependencies>) {
  return {
    onboardingSession: onboardingSession.value,
    telemetry,
    activateOnboardingConfirmation: auth.activateOnboardingConfirmation,
    confirmOnboarding: action.confirmIceCreamShopOnboarding,
    navigateToApp: () => navigation.navigateTo('app'),
    clearStoredOccurrence: onboardingSession.clearOccurrence,
  }
}

type ConfirmationOnboardingSession = {
  onboarding: PendingIceCreamShopOnboarding
  analyticsOccurrenceId?: string
}

function loadConfirmationSession(): ConfirmationOnboardingSession | undefined {
  const stored = loadOnboardingSession()
  return stored ? mapConfirmationOnboardingSession(stored) : undefined
}

function mapConfirmationOnboardingSession({
  onboarding,
  analyticsOccurrenceId,
}: StoredOnboardingSession): ConfirmationOnboardingSession {
  return {
    onboarding,
    ...(analyticsOccurrenceId ? { analyticsOccurrenceId } : {}),
  }
}

function useConfirmationOnboardingSession() {
  const [value, setValue] = useState(loadConfirmationSession)
  function clearOccurrence(): void {
    setValue((stored) => (stored ? { onboarding: stored.onboarding } : stored))
  }
  return { value, clearOccurrence }
}

function createPageActions(
  {
    activateOnboardingConfirmation,
    completeOnboardingConfirmation,
  }: ReturnType<typeof useAuthContext>,
  { navigateTo }: ReturnType<typeof useNavigation>,
  telemetry: ConfirmationTelemetry,
  { successfulConfirmationRef, invalidate }: ReturnType<typeof useConfirmationRequest>,
) {
  return createConfirmationPageActions({
    activateOnboardingConfirmation,
    completeOnboardingConfirmation,
    telemetry,
    successfulConfirmationRef,
    invalidate,
    navigateToApp: () => navigateTo('app'),
    navigateToOnboarding: () => navigateTo('onboarding'),
  })
}

function createConfirmationPageActions(input: ConfirmationPageActionsInput) {
  return {
    handleEnterApp: () => enterApp(input),
    handleRestart: () => restartConfirmation(input),
  }
}

async function enterApp(input: ConfirmationPageActionsInput): Promise<void> {
  const successfulConfirmation = input.successfulConfirmationRef.current
  const isAuthenticated = await activateConfirmation(input, successfulConfirmation)
  if (!isAuthenticated) return
  await input.navigateToApp()
}

async function activateConfirmation(
  input: ConfirmationPageActionsInput,
  successfulConfirmation: ConfirmationObservation | null,
): Promise<boolean> {
  const isAuthenticated = await activateOnboardingConfirmation(
    input,
    successfulConfirmation,
  )
  if (!isAuthenticated) recordActivationFailure(input, successfulConfirmation)
  return isAuthenticated
}

async function activateOnboardingConfirmation(
  input: ConfirmationPageActionsInput,
  successfulConfirmation: ConfirmationObservation | null,
): Promise<boolean> {
  try {
    return await input.activateOnboardingConfirmation()
  } catch (error) {
    recordActivationFailure(input, successfulConfirmation)
    throw error
  }
}

function recordActivationFailure(
  input: ConfirmationPageActionsInput,
  successfulConfirmation: ConfirmationObservation | null,
): void {
  if (successfulConfirmation)
    input.telemetry.recordActivationFailure(successfulConfirmation)
}

async function restartConfirmation(input: ConfirmationPageActionsInput): Promise<void> {
  await input.completeOnboardingConfirmation()
  input.invalidate()
  input.telemetry.endWorkflow()
  clearOnboardingSession()
  await input.navigateToOnboarding()
}
