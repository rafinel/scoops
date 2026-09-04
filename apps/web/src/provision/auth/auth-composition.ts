import { BROWSER_ENV } from '@/constants'
import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { IdentityService } from '@/rest/services/identity-service'

import { BetterAuthProvider } from './better-auth/better-auth-provider'

export type InitialAuthRedirectKind =
  | 'none'
  | 'password-recovery'
  | 'onboarding-confirmation'
  | 'invitation-acceptance'

export const AUTH_PROVIDER = BetterAuthProvider()

export function hasAuthPasswordRecoveryRedirect(): boolean {
  return getBrowserPathname() === '/reset-password'
}

export function resolveInitialAuthRedirect(): InitialAuthRedirectKind {
  const pathname = getBrowserPathname()
  if (pathname === '/reset-password') return 'password-recovery'
  if (pathname === '/onboarding/confirm') return 'onboarding-confirmation'
  if (pathname === '/invitation/accept') return 'invitation-acceptance'
  return 'none'
}

function getBrowserPathname(): string | null {
  return typeof window === 'undefined' ? null : window.location.pathname
}

const AUTH_REST_CLIENT = AxiosRestClient(BROWSER_ENV.scoopsServerAppUrl)

export const AUTH_IDENTITY_SERVICE = IdentityService(AUTH_REST_CLIENT)
