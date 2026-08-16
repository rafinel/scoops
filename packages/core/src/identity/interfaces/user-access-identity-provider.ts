export interface UserAccessIdentityProvider {
  inviteIdentity(input: {
    email: string
    invitationRedirectTo: string
  }): Promise<{ providerSubject: string } | undefined>
  correctPendingIdentityEmail(input: {
    providerSubject: string
    email: string
  }): Promise<void>
  resendInvitation(input: { email: string; invitationRedirectTo: string }): Promise<void>
  getIdentityEmail(providerSubject: string): Promise<string | undefined>
  removeIdentity(providerSubject: string): Promise<void>
}
