export interface OnboardingIdentityProvider {
  registerPendingIdentity(input: {
    email: string
    password: string
    confirmationRedirectTo: string
  }): Promise<{ providerSubject: string } | undefined>
  verifyPendingPassword(input: { email: string; password: string }): Promise<boolean>
  resendConfirmation(input: {
    email: string
    confirmationRedirectTo: string
  }): Promise<void>
  registerReplacementIdentity(input: {
    currentEmail: string
    email: string
    password: string
    confirmationRedirectTo: string
  }): Promise<{ providerSubject: string } | undefined>
  removeIdentity(providerSubject: string): Promise<void>
}
