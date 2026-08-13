import type { OnboardingIdentityProvider } from '@scoops/core/identity/interfaces'

export class TestOnboardingIdentityProvider implements OnboardingIdentityProvider {
  private subjectCounter: number = 1
  private readonly identities = new Map<string, string>()
  private readonly calls = {
    registerPendingIdentity: [] as Array<
      Parameters<OnboardingIdentityProvider['registerPendingIdentity']>
    >,
    resendConfirmation: [] as Array<
      Parameters<OnboardingIdentityProvider['resendConfirmation']>
    >,
    registerReplacementIdentity: [] as Array<
      Parameters<OnboardingIdentityProvider['registerReplacementIdentity']>
    >,
    removeIdentity: [] as Array<Parameters<OnboardingIdentityProvider['removeIdentity']>>,
  }

  registerPendingIdentity(
    input: Parameters<OnboardingIdentityProvider['registerPendingIdentity']>[0],
  ) {
    this.calls.registerPendingIdentity.push([input])
    const providerSubject = this.nextSubject()
    this.identities.set(providerSubject, input.email)
    return Promise.resolve({ providerSubject })
  }

  verifyPendingPassword() {
    return Promise.resolve(true)
  }

  resendConfirmation(
    input: Parameters<OnboardingIdentityProvider['resendConfirmation']>[0],
  ) {
    this.calls.resendConfirmation.push([input])
    return Promise.resolve()
  }

  registerReplacementIdentity(
    input: Parameters<OnboardingIdentityProvider['registerReplacementIdentity']>[0],
  ) {
    this.calls.registerReplacementIdentity.push([input])
    const providerSubject = this.nextSubject()
    this.identities.set(providerSubject, input.email)
    return Promise.resolve({ providerSubject })
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
    this.subjectCounter = 1
    this.identities.clear()
    this.calls.registerPendingIdentity.length = 0
    this.calls.resendConfirmation.length = 0
    this.calls.registerReplacementIdentity.length = 0
    this.calls.removeIdentity.length = 0
  }

  private nextSubject() {
    const suffix = String(this.subjectCounter++).padStart(12, '0')
    return `30000000-0000-0000-0000-${suffix}`
  }
}
