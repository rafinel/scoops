import { createClient } from '@supabase/supabase-js'

import { BROWSER_ENV } from '@/constants'

const PASSWORD_RECOVERY_REDIRECT_KEY = 'scoops.auth.password-recovery'

function getAuthHashParams(): URLSearchParams | null {
  if (typeof window === 'undefined') return null

  return new URLSearchParams(window.location.hash.slice(1))
}

const hasRecoveryHash = getAuthHashParams()?.get('type') === 'recovery'

if (hasRecoveryHash && typeof window !== 'undefined') {
  window.sessionStorage.setItem(PASSWORD_RECOVERY_REDIRECT_KEY, 'true')
}

export function hasPasswordRecoveryRedirect(): boolean {
  if (typeof window === 'undefined') return false

  return (
    hasRecoveryHash ||
    window.sessionStorage.getItem(PASSWORD_RECOVERY_REDIRECT_KEY) === 'true'
  )
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
