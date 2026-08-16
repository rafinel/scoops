import type { AuthIdentityProvider } from '#identity/interfaces/auth-identity-provider.ts'
import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { UserAccessIdentityProvider } from '#identity/interfaces/user-access-identity-provider.ts'

export interface ServerAuthProvider
  extends AuthIdentityProvider,
    OnboardingIdentityProvider,
    UserAccessIdentityProvider {}
