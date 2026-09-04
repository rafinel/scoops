import { useEffect, useRef, useState } from 'react'

import { useConfirmIceCreamShopOnboardingAction } from '@/ui/identity/hooks/use-confirm-ice-cream-shop-onboarding-action'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import {
  clearOnboardingSession,
  loadOnboardingSession,
} from '@/ui/identity/storage/onboarding-session-storage'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export function useOnboardingConfirmationPage(confirmationToken?: string) {
  const hasValidConfirmationToken =
    typeof confirmationToken === 'string' && /^[A-Za-z0-9_-]{43}$/.test(confirmationToken)
  const [state, setState] = useState<
    'confirming' | 'success' | 'unavailable' | 'provider-error'
  >(hasValidConfirmationToken ? 'confirming' : 'unavailable')
  const generationRef = useRef(0)
  const inFlightRef = useRef<{
    token: string
    promise: Promise<void>
  } | null>(null)
  const auth = useAuthContext()
  const navigation = useNavigation()
  const action = useConfirmIceCreamShopOnboardingAction()
  const { confirmIceCreamShopOnboarding } = action
  const onboarding = loadOnboardingSession()?.onboarding

  // biome-ignore lint/correctness/useExhaustiveDependencies: callback must run once per confirmation URL
  useEffect(() => {
    if (!hasValidConfirmationToken) {
      inFlightRef.current = null
      return
    }
    const generation = ++generationRef.current
    const request =
      inFlightRef.current?.token === confirmationToken
        ? inFlightRef.current.promise
        : confirmIceCreamShopOnboarding(confirmationToken)
    inFlightRef.current = { token: confirmationToken, promise: request }
    void request
      .then(async () => {
        if (generation !== generationRef.current) return
        clearOnboardingSession()

        const isAuthenticated = await auth.activateOnboardingConfirmation()
        if (generation !== generationRef.current) return
        if (!isAuthenticated) {
          setState('provider-error')
          return
        }

        setState('success')
        await navigation.navigateTo('app')
      })
      .catch(() => {
        if (generation === generationRef.current) setState('provider-error')
      })
    return () => {
      generationRef.current += 1
    }
  }, [confirmationToken])

  async function handleEnterApp() {
    const isAuthenticated = await auth.activateOnboardingConfirmation()
    if (isAuthenticated) await navigation.navigateTo('app')
  }
  async function handleRestart() {
    await auth.completeOnboardingConfirmation()
    clearOnboardingSession()
    await navigation.navigateTo('onboarding')
  }

  return {
    state,
    error: action.error,
    onboarding,
    isPending: action.isPending,
    handleEnterApp,
    handleRestart,
  }
}
