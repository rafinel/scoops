import type { AuthUser } from '@scoops/core/identity/domain/structures'
import type { ServerAuthProvider } from '@scoops/core/identity/interfaces'
import { AuthenticationProviderUnavailableError } from '@scoops/core/identity/domain/errors'

export class SupabaseAuthFixture implements ServerAuthProvider {
  private readonly usersByToken = new Map<string, AuthUser>()
  private readonly identities = new Map<string, string>()
  private isUnavailable = false
  private subjectCounter = 1
  private readonly calls = {
    registerPendingIdentity: [] as Array<
      Parameters<ServerAuthProvider['registerPendingIdentity']>
    >,
    resendConfirmation: [] as Array<Parameters<ServerAuthProvider['resendConfirmation']>>,
    registerReplacementIdentity: [] as Array<
      Parameters<ServerAuthProvider['registerReplacementIdentity']>
    >,
    inviteIdentity: [] as Array<Parameters<ServerAuthProvider['inviteIdentity']>>,
    correctPendingIdentityEmail: [] as Array<
      Parameters<ServerAuthProvider['correctPendingIdentityEmail']>
    >,
    resendInvitation: [] as Array<Parameters<ServerAuthProvider['resendInvitation']>>,
    getIdentityEmail: [] as Array<Parameters<ServerAuthProvider['getIdentityEmail']>>,
    removeIdentity: [] as Array<Parameters<ServerAuthProvider['removeIdentity']>>,
  }

  setUser(accessToken: string, user: AuthUser) {
    this.usersByToken.set(accessToken, user)
  }

  setUnavailable(isUnavailable: boolean) {
    this.isUnavailable = isUnavailable
  }

  async verifyAccessToken(accessToken: string): Promise<AuthUser | undefined> {
    if (this.isUnavailable) throw new AuthenticationProviderUnavailableError()

    return this.usersByToken.get(accessToken)
  }

  registerPendingIdentity(
    input: Parameters<ServerAuthProvider['registerPendingIdentity']>[0],
  ) {
    this.calls.registerPendingIdentity.push([input])
    const providerSubject = this.nextSubject()
    this.identities.set(providerSubject, input.email)
    return Promise.resolve({ providerSubject })
  }

  verifyPendingPassword() {
    return Promise.resolve(true)
  }

  resendConfirmation(input: Parameters<ServerAuthProvider['resendConfirmation']>[0]) {
    this.calls.resendConfirmation.push([input])
    return Promise.resolve()
  }

  registerReplacementIdentity(
    input: Parameters<ServerAuthProvider['registerReplacementIdentity']>[0],
  ) {
    this.calls.registerReplacementIdentity.push([input])
    const providerSubject = this.nextSubject()
    this.identities.set(providerSubject, input.email)
    return Promise.resolve({ providerSubject })
  }

  inviteIdentity(input: Parameters<ServerAuthProvider['inviteIdentity']>[0]) {
    this.calls.inviteIdentity.push([input])
    const providerSubject = this.nextSubject()
    this.identities.set(providerSubject, input.email)
    return Promise.resolve({ providerSubject })
  }

  correctPendingIdentityEmail(
    input: Parameters<ServerAuthProvider['correctPendingIdentityEmail']>[0],
  ) {
    this.calls.correctPendingIdentityEmail.push([input])
    this.identities.set(input.providerSubject, input.email)
    return Promise.resolve()
  }

  resendInvitation(input: Parameters<ServerAuthProvider['resendInvitation']>[0]) {
    this.calls.resendInvitation.push([input])
    return Promise.resolve()
  }

  getIdentityEmail(providerSubject: string) {
    this.calls.getIdentityEmail.push([providerSubject])
    return Promise.resolve(this.identities.get(providerSubject))
  }

  removeIdentity(providerSubject: string) {
    this.calls.removeIdentity.push([providerSubject])
    this.identities.delete(providerSubject)
    return Promise.resolve()
  }

  getCalls() {
    return this.calls
  }

  clear() {
    this.usersByToken.clear()
    this.identities.clear()
    this.isUnavailable = false
    this.subjectCounter = 1
    this.calls.registerPendingIdentity.length = 0
    this.calls.resendConfirmation.length = 0
    this.calls.registerReplacementIdentity.length = 0
    this.calls.inviteIdentity.length = 0
    this.calls.correctPendingIdentityEmail.length = 0
    this.calls.resendInvitation.length = 0
    this.calls.getIdentityEmail.length = 0
    this.calls.removeIdentity.length = 0
  }

  private nextSubject() {
    const suffix = String(this.subjectCounter++).padStart(12, '0')
    return `40000000-0000-0000-0000-${suffix}`
  }
}
