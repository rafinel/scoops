import { useCallback, useEffect, useRef, useState } from 'react'

import type { AuthProvider } from '@scoops/core/identity/interfaces'
import type {
  AuthCredentials,
  AuthSession,
  AuthStateChange,
} from '@scoops/core/identity/domain/structures'
import type { Account } from '@scoops/core/identity/domain/entities'
import type { IdentityService } from '@scoops/core/identity/interfaces'
import { HTTP_STATUS_CODE } from '@scoops/core/shared/constants'

import { clearOnboardingConfirmationRedirect } from '@/provision/auth/supabase/supabase-client'

import type { AuthContextValue, AuthStatus } from './types'

export function useAuthContextProvider(
  authProvider: AuthProvider,
  identityService: Pick<IdentityService, 'getAccount'>,
  resolveInitialRedirect:
    | (() => 'none' | 'password-recovery' | 'onboarding-confirmation')
    | boolean = false,
): AuthContextValue {
  const [status, setStatus] = useState<AuthStatus>('resolving')
  const [session, setSession] = useState<AuthSession | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [isOnboardingConfirmation, setIsOnboardingConfirmation] = useState(false)
  const authGenerationRef = useRef(0)
  const isMountedRef = useRef(false)
  const sessionRef = useRef<AuthSession | null>(null)
  const statusRef = useRef<AuthStatus>('resolving')
  const isLocalRejectionRef = useRef(false)
  const isPasswordRecoveryRef = useRef(
    typeof resolveInitialRedirect === 'boolean' ? resolveInitialRedirect : false,
  )
  const isOnboardingConfirmationRef = useRef(false)
  const isInitialResolutionPendingRef = useRef(true)

  const commitState = useCallback(function commitState(
    nextStatus: AuthStatus,
    nextSession: AuthSession | null,
    nextAccount: Account | null,
    nextRecovery = isPasswordRecoveryRef.current,
    nextOnboardingConfirmation = isOnboardingConfirmationRef.current,
  ) {
    if (!isMountedRef.current) return

    sessionRef.current = nextSession
    statusRef.current = nextStatus
    setStatus(nextStatus)
    setSession(nextSession)
    setAccount(nextAccount)
    isPasswordRecoveryRef.current = nextRecovery
    setIsPasswordRecovery(nextRecovery)
    isOnboardingConfirmationRef.current = nextOnboardingConfirmation
    setIsOnboardingConfirmation(nextOnboardingConfirmation)
  }, [])

  const canCommit = useCallback(function canCommit(generation: number) {
    return isMountedRef.current && authGenerationRef.current === generation
  }, [])

  const publishUnavailable = useCallback(
    function publishUnavailable(
      candidateSession: AuthSession | null,
      generation: number,
      recovery = false,
    ) {
      if (!canCommit(generation)) return

      commitState('unavailable', candidateSession, null, recovery)
    },
    [canCommit, commitState],
  )

  const rejectLocalAccess = useCallback(
    async function rejectLocalAccess(generation: number, recovery = false) {
      if (!canCommit(generation)) return

      authGenerationRef.current += 1
      const rejectionGeneration = authGenerationRef.current
      isLocalRejectionRef.current = true
      commitState('denied', null, null, recovery)

      try {
        await authProvider.signOut('local')
      } catch {
        // The provider session is unusable locally even when provider cleanup fails.
      } finally {
        isLocalRejectionRef.current = false
      }

      if (!canCommit(rejectionGeneration)) return

      commitState('denied', null, null, recovery)
    },
    [authProvider, canCommit, commitState],
  )

  const validateLocalAccess = useCallback(
    async function validateLocalAccess(
      candidateSession: AuthSession,
      generation: number,
      recovery = false,
    ): Promise<boolean> {
      if (!canCommit(generation)) return false

      try {
        const response = await identityService.getAccount()

        if (!canCommit(generation)) return false

        if (response.statusCode === HTTP_STATUS_CODE.unauthorized) {
          await rejectLocalAccess(generation, recovery)
          return false
        }

        if (
          response.statusCode === HTTP_STATUS_CODE.serviceUnavailable ||
          response.isFailure
        ) {
          publishUnavailable(candidateSession, generation, recovery)
          return false
        }

        const nextAccount = response.body

        if (!nextAccount) {
          publishUnavailable(candidateSession, generation, recovery)
          return false
        }

        commitState('authenticated', candidateSession, nextAccount, recovery)
        return true
      } catch {
        publishUnavailable(candidateSession, generation, recovery)
        return false
      }
    },
    [canCommit, commitState, identityService, publishUnavailable, rejectLocalAccess],
  )

  const restoreSession = useCallback(
    async function restoreSession(generation: number) {
      try {
        const restoredSession = await authProvider.getSession()
        isInitialResolutionPendingRef.current = false

        if (!canCommit(generation)) return

        if (!restoredSession) {
          commitState('anonymous', null, null, false)
          return
        }

        if (isOnboardingConfirmationRef.current) {
          commitState('anonymous', restoredSession, null, false, true)
          return
        }

        await validateLocalAccess(
          restoredSession,
          generation,
          isPasswordRecoveryRef.current,
        )
      } catch {
        isInitialResolutionPendingRef.current = false
        publishUnavailable(null, generation)
      }
    },
    [authProvider, canCommit, commitState, publishUnavailable, validateLocalAccess],
  )

  const processProviderEvent = useCallback(
    async function processProviderEvent(
      event: AuthStateChange,
      nextSession: AuthSession | null,
    ) {
      if (
        event === 'INITIAL_SESSION' &&
        !nextSession &&
        (isInitialResolutionPendingRef.current || sessionRef.current)
      ) {
        return
      }

      if (event === 'INITIAL_SESSION') {
        isInitialResolutionPendingRef.current = false
      }

      if (event === 'SIGNED_OUT') {
        if (isLocalRejectionRef.current || statusRef.current === 'denied') return

        authGenerationRef.current += 1
        commitState('anonymous', null, null, false)
        return
      }

      if (isOnboardingConfirmationRef.current) {
        if (nextSession) {
          commitState('anonymous', nextSession, null, false, true)
        }
        return
      }

      const generation = ++authGenerationRef.current
      const recovery = event === 'PASSWORD_RECOVERY' || isPasswordRecoveryRef.current

      if (!nextSession) {
        commitState(
          event === 'TOKEN_REFRESHED' ? 'expired' : 'anonymous',
          null,
          null,
          false,
        )
        return
      }

      await validateLocalAccess(nextSession, generation, recovery)
    },
    [commitState, validateLocalAccess],
  )

  useEffect(() => {
    isMountedRef.current = true
    const initialRedirect =
      typeof resolveInitialRedirect === 'function'
        ? resolveInitialRedirect()
        : resolveInitialRedirect === true
          ? 'password-recovery'
          : 'none'
    isPasswordRecoveryRef.current = initialRedirect === 'password-recovery'
    isOnboardingConfirmationRef.current = initialRedirect === 'onboarding-confirmation'
    setIsPasswordRecovery(isPasswordRecoveryRef.current)
    setIsOnboardingConfirmation(isOnboardingConfirmationRef.current)
    const generation = authGenerationRef.current
    const unsubscribe = authProvider.onAuthStateChange((event, nextSession) => {
      void processProviderEvent(event, nextSession)
    })

    void restoreSession(generation)

    return () => {
      isMountedRef.current = false
      authGenerationRef.current += 1
      unsubscribe()
    }
  }, [authProvider, processProviderEvent, resolveInitialRedirect, restoreSession])

  const getSession = useCallback(
    function getSession() {
      return authProvider.getSession()
    },
    [authProvider],
  )

  const signIn = useCallback(
    async function signIn(credentials: AuthCredentials) {
      const generation = ++authGenerationRef.current
      commitState('resolving', null, null, false)

      try {
        const signedInSession = await authProvider.signIn(credentials)

        if (!canCommit(generation)) return

        await validateLocalAccess(signedInSession, generation)
      } catch (error) {
        if (canCommit(generation)) commitState('anonymous', null, null, false)
        throw error
      }
    },
    [authProvider, canCommit, commitState, validateLocalAccess],
  )

  const signOut = useCallback(
    async function signOut() {
      ++authGenerationRef.current
      commitState('anonymous', null, null, false)
      await authProvider.signOut('local')
    },
    [authProvider, commitState],
  )

  const requestPasswordReset = useCallback(
    function requestPasswordReset(email: string) {
      const redirectTo =
        typeof window === 'undefined'
          ? '/reset-password'
          : new URL('/reset-password', window.location.origin).toString()

      return authProvider.requestPasswordReset(email, redirectTo)
    },
    [authProvider],
  )

  const resetPassword = useCallback(
    async function resetPassword(password: string) {
      ++authGenerationRef.current
      await authProvider.updatePassword(password)

      ++authGenerationRef.current
      commitState('anonymous', null, null, false)
      await authProvider.signOut('global')
    },
    [authProvider, commitState],
  )

  const retryLocalAccess = useCallback(
    async function retryLocalAccess() {
      const generation = ++authGenerationRef.current
      const candidateSession = sessionRef.current

      if (!candidateSession) {
        await restoreSession(generation)
        return
      }

      commitState('resolving', candidateSession, null, isPasswordRecovery)
      await validateLocalAccess(candidateSession, generation, isPasswordRecovery)
    },
    [commitState, isPasswordRecovery, restoreSession, validateLocalAccess],
  )

  const activateOnboardingConfirmation = useCallback(
    async function activateOnboardingConfirmation(): Promise<boolean> {
      const generation = ++authGenerationRef.current
      isOnboardingConfirmationRef.current = false
      clearOnboardingConfirmationRedirect()

      const candidateSession = sessionRef.current ?? (await authProvider.getSession())

      if (!canCommit(generation)) return false

      if (!candidateSession) {
        commitState('anonymous', null, null, false, false)
        return false
      }

      commitState('resolving', candidateSession, null, false, false)
      return validateLocalAccess(candidateSession, generation)
    },
    [authProvider, canCommit, commitState, validateLocalAccess],
  )

  const completeOnboardingConfirmation = useCallback(
    async function completeOnboardingConfirmation() {
      authGenerationRef.current += 1
      isOnboardingConfirmationRef.current = false
      clearOnboardingConfirmationRedirect()
      commitState('anonymous', null, null, false, false)
      await authProvider.signOut('local')
    },
    [authProvider, commitState],
  )

  return {
    status,
    session,
    account,
    isPasswordRecovery,
    isOnboardingConfirmation,
    getSession,
    signIn,
    signOut,
    requestPasswordReset,
    resetPassword,
    retryLocalAccess,
    activateOnboardingConfirmation,
    completeOnboardingConfirmation,
  }
}
