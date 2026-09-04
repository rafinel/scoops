import type { AuthUser } from '#identity/domain/structures/auth-user.ts'
import type { UserInvitationPreparedEvent } from '#identity/domain/events/user-invitation-prepared-event.ts'

export interface UserAccessIdentityProvider {
  inviteIdentity(input: {
    establishmentId: string
    email: string
    name: string
    invitationRedirectTo: string
  }): Promise<{ authUser: AuthUser; event: UserInvitationPreparedEvent }>
  correctPendingIdentity(input: {
    providerSubject: string
    establishmentId: string
    email: string
    name: string
    invitationRedirectTo: string
  }): Promise<UserInvitationPreparedEvent>
  prepareInvitationResend(input: {
    providerSubject: string
    establishmentId: string
    invitationRedirectTo: string
  }): Promise<UserInvitationPreparedEvent>
  setInvitationPassword(input: {
    providerSubject: string
    password: string
  }): Promise<AuthUser>
  getIdentityEmail(providerSubject: string): Promise<string | undefined>
  revokeSessions(providerSubject: string): Promise<void>
  removeIdentity(providerSubject: string): Promise<void>
}
