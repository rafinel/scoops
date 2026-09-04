import type { OnboardingIdentityProvider } from '#identity/interfaces/onboarding-identity-provider.ts'
import type { PasswordRecoveryIdentityProvider } from '#identity/interfaces/password-recovery-identity-provider.ts'
import type { UserAccessIdentityProvider } from '#identity/interfaces/user-access-identity-provider.ts'

export interface ServerAuthProvider
  extends OnboardingIdentityProvider,
    UserAccessIdentityProvider,
    PasswordRecoveryIdentityProvider {}
