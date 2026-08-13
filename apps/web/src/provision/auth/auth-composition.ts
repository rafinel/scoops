import { BROWSER_ENV } from '@/constants'
import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { IdentityService } from '@/rest/services/identity-service'

import { SupabaseAuthProvider } from './supabase/supabase-auth-provider'
import { hasPasswordRecoveryRedirect } from './supabase/supabase-client'

export const AUTH_PROVIDER = SupabaseAuthProvider()

export function hasAuthPasswordRecoveryRedirect(): boolean {
  return hasPasswordRecoveryRedirect()
}

const AUTH_REST_CLIENT = AxiosRestClient(BROWSER_ENV.scoopsServerAppUrl, () =>
  AUTH_PROVIDER.getSession(),
)

export const AUTH_IDENTITY_SERVICE = IdentityService(AUTH_REST_CLIENT)
