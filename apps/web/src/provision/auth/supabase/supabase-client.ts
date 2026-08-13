import { createClient } from '@supabase/supabase-js'

import { BROWSER_ENV } from '@/constants'

const PASSWORD_RECOVERY_REDIRECT_KEY = 'scoops.auth.password-recovery'
const ONBOARDING_CONFIRMATION_REDIRECT_KEY = 'scoops.auth.onboarding-confirmation'
const CONFIRMATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export type InitialAuthRedirectKind =
  | 'none'
  | 'password-recovery'
  | 'onboarding-confirmation'

function getAuthHashParams(): URLSearchParams | null {
  if (typeof window === 'undefined') return null

  return new URLSearchParams(window.location.hash.slice(1))
}

function classifyInitialAuthRedirect(): InitialAuthRedirectKind {
  if (typeof window === 'undefined') return 'none'

  const hashParams = getAuthHashParams()
  const searchParams = new URLSearchParams(window.location.search)
  const confirmationToken = searchParams.get('confirmationToken')
  const isSignupConfirmation =
    hashParams?.get('type') === 'signup' &&
    confirmationToken !== null &&
    CONFIRMATION_TOKEN_PATTERN.test(confirmationToken)

  if (isSignupConfirmation) return 'onboarding-confirmation'
  if (hashParams?.get('type') === 'recovery') return 'password-recovery'

  if (window.sessionStorage.getItem(ONBOARDING_CONFIRMATION_REDIRECT_KEY) === 'true') {
    return 'onboarding-confirmation'
  }

  if (window.sessionStorage.getItem(PASSWORD_RECOVERY_REDIRECT_KEY) === 'true') {
    return 'password-recovery'
  }

  return 'none'
}

export const INITIAL_AUTH_REDIRECT_KIND = classifyInitialAuthRedirect()
const hasRecoveryHash = INITIAL_AUTH_REDIRECT_KIND === 'password-recovery'
const hasConfirmationHash = INITIAL_AUTH_REDIRECT_KIND === 'onboarding-confirmation'

if (hasRecoveryHash && typeof window !== 'undefined') {
  window.sessionStorage.setItem(PASSWORD_RECOVERY_REDIRECT_KEY, 'true')
}

if (hasConfirmationHash && typeof window !== 'undefined') {
  window.sessionStorage.setItem(ONBOARDING_CONFIRMATION_REDIRECT_KEY, 'true')
}

export function hasPasswordRecoveryRedirect(): boolean {
  if (typeof window === 'undefined') return false

  return (
    hasRecoveryHash ||
    window.sessionStorage.getItem(PASSWORD_RECOVERY_REDIRECT_KEY) === 'true'
  )
}

export function hasOnboardingConfirmationRedirect(): boolean {
  if (typeof window === 'undefined') return false

  return (
    hasConfirmationHash ||
    window.sessionStorage.getItem(ONBOARDING_CONFIRMATION_REDIRECT_KEY) === 'true'
  )
}

export function clearOnboardingConfirmationRedirect(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(ONBOARDING_CONFIRMATION_REDIRECT_KEY)
  }
}

export function hasPasswordRecoveryErrorRedirect(): boolean {
  const hashParams = getAuthHashParams()

  return (
    hashParams?.get('error') === 'access_denied' &&
    hashParams.get('error_code') === 'otp_expired'
  )
}

export function clearPasswordRecoveryRedirect(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(PASSWORD_RECOVERY_REDIRECT_KEY)
  }
}

export const supabaseClient = createClient(
  BROWSER_ENV.supabaseUrl,
  BROWSER_ENV.supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  },
)
