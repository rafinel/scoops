import type { AuthUser } from '#identity/domain/structures/auth-user.ts'
import type { OnboardingConfirmationPreparedEvent } from '#identity/domain/events/onboarding-confirmation-prepared-event.ts'

export interface OnboardingIdentityProvider {
  registerPendingIdentity(input: {
    email: string
    password: string
    name: string
    confirmationRedirectTo: string
  }): Promise<{
    authUser: AuthUser
    event: OnboardingConfirmationPreparedEvent
  }>
  prepareOnboardingConfirmation(input: {
    providerSubject: string
    confirmationRedirectTo: string
  }): Promise<OnboardingConfirmationPreparedEvent>
  inspectOnboardingConfirmation(token: string): Promise<AuthUser | undefined>
  completeOnboardingConfirmation(token: string): Promise<AuthUser>
  replacePendingIdentity(input: {
    providerSubject: string
    email: string
    password: string
    name: string
    confirmationRedirectTo: string
  }): Promise<{
    authUser: AuthUser
    event: OnboardingConfirmationPreparedEvent
  }>
  removeIdentity(providerSubject: string): Promise<void>
}
