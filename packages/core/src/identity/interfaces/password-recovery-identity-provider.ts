import type { AuthUser } from '#identity/domain/structures/auth-user.ts'
import type { PasswordRecoveryPreparedEvent } from '#identity/domain/events/password-recovery-prepared-event.ts'

export interface PasswordRecoveryIdentityProvider {
  preparePasswordRecovery(input: {
    providerSubject: string
    recoveryRedirectTo: string
  }): Promise<PasswordRecoveryPreparedEvent>
  resetPassword(input: { token: string; password: string }): Promise<AuthUser>
}
