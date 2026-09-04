import type { Account } from '@scoops/core/identity/domain/entities'
import type {
  AuthCredentials,
  AuthSession,
} from '@scoops/core/identity/domain/structures'

export type AuthStatus =
  | 'resolving'
  | 'authenticated'
  | 'anonymous'
  | 'expired'
  | 'denied'
  | 'unavailable'

export type AuthContextValue = {
  status: AuthStatus
  session: AuthSession | null
  account: Account | null
  isPasswordRecovery: boolean
  isOnboardingConfirmation: boolean
  isInvitationAcceptance: boolean
  getSession(): Promise<AuthSession | null>
  refreshAccount(): Promise<Account | null>
  signIn(credentials: AuthCredentials): Promise<void>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  resetPassword(password: string): Promise<void>
  retryLocalAccess(): Promise<void>
  activateOnboardingConfirmation(): Promise<boolean>
  completeOnboardingConfirmation(): Promise<void>
  clearInvitationAcceptance(): Promise<void>
  activateInvitationAcceptance(): Promise<boolean>
}
