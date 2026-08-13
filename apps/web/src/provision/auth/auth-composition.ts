import { BROWSER_ENV } from '@/constants'
import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { IdentityService } from '@/rest/services/identity-service'

import { SupabaseAuthProvider } from './supabase/supabase-auth-provider'
import {
  INITIAL_AUTH_REDIRECT_KIND,
  hasOnboardingConfirmationRedirect,
  hasPasswordRecoveryRedirect,
  type InitialAuthRedirectKind,
} from './supabase/supabase-client'

export const AUTH_PROVIDER = SupabaseAuthProvider()

export function hasAuthPasswordRecoveryRedirect(): boolean {
  return hasPasswordRecoveryRedirect()
}

export function resolveInitialAuthRedirect(): InitialAuthRedirectKind {
  if (INITIAL_AUTH_REDIRECT_KIND !== 'none') return INITIAL_AUTH_REDIRECT_KIND
  if (hasOnboardingConfirmationRedirect()) return 'onboarding-confirmation'
  if (hasPasswordRecoveryRedirect()) return 'password-recovery'
  return 'none'
}

const AUTH_REST_CLIENT = AxiosRestClient(BROWSER_ENV.scoopsServerAppUrl, () =>
  AUTH_PROVIDER.getSession(),
)

export const AUTH_IDENTITY_SERVICE = IdentityService(AUTH_REST_CLIENT)
