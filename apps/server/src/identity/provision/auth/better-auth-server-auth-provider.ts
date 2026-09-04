import { Inject, Injectable } from '@nestjs/common'
import { randomBytes, randomUUID } from 'node:crypto'
import {
  OnboardingConfirmationPreparedEvent,
  PasswordRecoveryPreparedEvent,
  UserInvitationPreparedEvent,
} from '@scoops/core/identity/domain/events'
import {
  AuthenticationAccountUnavailableError,
  AuthenticationMessageRateLimitedError,
} from '@scoops/core/identity/domain/errors'
import { BadRequestError } from '@scoops/core/shared/domain/errors'
import type { AuthUser } from '@scoops/core/identity/domain/structures'
import type { ServerAuthProvider } from '@scoops/core/identity/interfaces'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import type { BetterAuthInstance } from '@/identity/provision/auth/better-auth'
import { hashPassword } from '@/identity/provision/auth/better-auth-password'
import { BetterAuthSecurityControls } from '@/identity/provision/auth/better-auth-security-controls'

const IDENTITY_TOKEN_PREFIXES = {
  onboarding: 'scoops:onboarding:',
  invitation: 'scoops:invitation:',
  recovery: 'scoops:recovery:',
} as const

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

@Injectable()
export class BetterAuthServerAuthProvider implements ServerAuthProvider {
  constructor(
    @Inject(IDENTITY_PROVIDERS.betterAuth)
    private readonly auth: BetterAuthInstance,
    private readonly securityControls: BetterAuthSecurityControls,
  ) {}

  async registerPendingIdentity(input: {
    email: string
    password: string
    name: string
    confirmationRedirectTo: string
  }) {
    const authUser = await this.createCredentialIdentity(input)
    const event = await this.prepareOnboardingConfirmation({
      providerSubject: authUser.id,
      confirmationRedirectTo: input.confirmationRedirectTo,
    })
    return { authUser, event }
  }

  async prepareOnboardingConfirmation(input: {
    providerSubject: string
    confirmationRedirectTo: string
  }) {
    const user = await this.requireUser(input.providerSubject)
    await this.requireMessageQuota(user.email, 'verification')
    const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS)
    const actionUrl = await this.storeToken(
      IDENTITY_TOKEN_PREFIXES.onboarding,
      input.confirmationRedirectTo,
      user.id,
      expiresAt,
      'confirmationToken',
    )
    return new OnboardingConfirmationPreparedEvent({
      userId: user.id,
      email: user.email,
      name: user.name,
      actionUrl,
      expiresAt: expiresAt.toISOString(),
      occurredAt: new Date().toISOString(),
    })
  }

  async inspectOnboardingConfirmation(token: string): Promise<AuthUser | undefined> {
    return this.inspectToken(IDENTITY_TOKEN_PREFIXES.onboarding, token)
  }

  async completeOnboardingConfirmation(token: string): Promise<AuthUser> {
    return this.completeToken(IDENTITY_TOKEN_PREFIXES.onboarding, token)
  }

  async replacePendingIdentity(input: {
    providerSubject: string
    email: string
    password: string
    name: string
    confirmationRedirectTo: string
  }) {
    let replacementSubject: string | undefined
    try {
      const authUser = await this.createCredentialIdentity({
        email: input.email,
        password: input.password,
        name: input.name,
      })
      replacementSubject = authUser.id
      const event = await this.prepareOnboardingConfirmation({
        providerSubject: authUser.id,
        confirmationRedirectTo: input.confirmationRedirectTo,
      })
      return { authUser, event }
    } catch (error) {
      if (replacementSubject) await this.removeIdentity(replacementSubject)
      throw error
    }
  }

  removeIdentity(providerSubject: string): Promise<void> {
    return this.auth.$context.then((context) =>
      context.internalAdapter.deleteUser(providerSubject),
    )
  }

  async inviteIdentity(input: {
    establishmentId: string
    email: string
    name: string
    invitationRedirectTo: string
  }) {
    const context = await this.auth.$context
    const authUser = await context.internalAdapter.createUser({
      id: randomUUID(),
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      emailVerified: false,
    })
    await context.internalAdapter.createAccount({
      id: randomUUID(),
      accountId: authUser.id,
      providerId: 'credential',
      userId: authUser.id,
    })
    const event = await this.prepareInvitation({
      providerSubject: authUser.id,
      establishmentId: input.establishmentId,
      invitationRedirectTo: input.invitationRedirectTo,
      operation: 'initial',
    })
    return { authUser: this.toAuthUser(authUser), event }
  }

  async correctPendingIdentity(input: {
    providerSubject: string
    establishmentId: string
    email: string
    name: string
    invitationRedirectTo: string
  }) {
    const context = await this.auth.$context
    const user = await context.internalAdapter.updateUser(input.providerSubject, {
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      emailVerified: false,
    })
    return this.prepareInvitation({
      providerSubject: user.id,
      establishmentId: input.establishmentId,
      invitationRedirectTo: input.invitationRedirectTo,
      operation: 'corrected',
    })
  }

  prepareInvitationResend(input: {
    providerSubject: string
    establishmentId: string
    invitationRedirectTo: string
  }) {
    return this.prepareInvitation({
      ...input,
      operation: 'resent',
    })
  }

  async setInvitationPassword(input: { providerSubject: string; password: string }) {
    const context = await this.auth.$context
    await context.internalAdapter.updatePassword(
      input.providerSubject,
      await hashPassword(input.password),
    )
    const user = await context.internalAdapter.updateUser(input.providerSubject, {
      emailVerified: true,
    })
    return this.toAuthUser(user)
  }

  async getIdentityEmail(providerSubject: string): Promise<string | undefined> {
    const context = await this.auth.$context
    return (await context.internalAdapter.findUserById(providerSubject))?.email
  }

  async revokeSessions(providerSubject: string): Promise<void> {
    const context = await this.auth.$context
    await context.internalAdapter.deleteUserSessions(providerSubject)
  }

  async preparePasswordRecovery(input: {
    providerSubject: string
    recoveryRedirectTo: string
  }) {
    const user = await this.requireUser(input.providerSubject)
    await this.requireMessageQuota(user.email, 'recovery')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    const actionUrl = await this.storeToken(
      IDENTITY_TOKEN_PREFIXES.recovery,
      input.recoveryRedirectTo,
      user.id,
      expiresAt,
      'token',
    )
    return new PasswordRecoveryPreparedEvent({
      userId: user.id,
      email: user.email,
      name: user.name,
      actionUrl,
      expiresAt: expiresAt.toISOString(),
      occurredAt: new Date().toISOString(),
    })
  }

  async resetPassword(input: { token: string; password: string }): Promise<AuthUser> {
    const context = await this.auth.$context
    const verification = await context.internalAdapter.consumeVerificationValue(
      `${IDENTITY_TOKEN_PREFIXES.recovery}${input.token}`,
    )
    if (!verification) throw new BadRequestError('Recovery token is invalid or expired')
    await context.internalAdapter.updatePassword(
      verification.value,
      await hashPassword(input.password),
    )
    const user = await context.internalAdapter.updateUser(verification.value, {
      emailVerified: true,
    })
    await context.internalAdapter.deleteUserSessions(verification.value)
    return this.toAuthUser(user)
  }

  private async createCredentialIdentity(input: {
    email: string
    password: string
    name: string
  }): Promise<AuthUser> {
    const context = await this.auth.$context
    const user = await context.internalAdapter.createUser({
      id: randomUUID(),
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      emailVerified: false,
    })
    await context.internalAdapter.createAccount({
      id: randomUUID(),
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: await hashPassword(input.password),
    })
    return this.toAuthUser(user)
  }

  private async prepareInvitation(input: {
    providerSubject: string
    establishmentId: string
    invitationRedirectTo: string
    operation: 'initial' | 'corrected' | 'resent'
  }) {
    const user = await this.requireUser(input.providerSubject)
    await this.requireMessageQuota(user.email, 'invitation')
    const expiresAt = new Date(Date.now() + SEVEN_DAYS_MS)
    const actionUrl = await this.storeToken(
      IDENTITY_TOKEN_PREFIXES.invitation,
      input.invitationRedirectTo,
      user.id,
      expiresAt,
      'confirmationToken',
    )
    return new UserInvitationPreparedEvent({
      userId: user.id,
      establishmentId: input.establishmentId,
      email: user.email,
      name: user.name,
      actionUrl,
      expiresAt: expiresAt.toISOString(),
      occurredAt: new Date().toISOString(),
      operation: input.operation,
    })
  }

  private async requireMessageQuota(
    email: string,
    kind: 'verification' | 'recovery' | 'invitation',
  ): Promise<void> {
    if (!(await this.securityControls.consumeMessageQuota(email, kind))) {
      throw new AuthenticationMessageRateLimitedError()
    }
  }

  private async inspectToken(
    prefix: string,
    token: string,
  ): Promise<AuthUser | undefined> {
    const context = await this.auth.$context
    const verification = await context.internalAdapter.findVerificationValue(
      `${prefix}${token}`,
    )
    if (!verification || verification.expiresAt.getTime() <= Date.now()) return undefined
    const user = await context.internalAdapter.findUserById(verification.value)
    return user ? this.toAuthUser(user) : undefined
  }

  private async completeToken(prefix: string, token: string): Promise<AuthUser> {
    const context = await this.auth.$context
    const verification = await context.internalAdapter.consumeVerificationValue(
      `${prefix}${token}`,
    )
    if (!verification)
      throw new BadRequestError('Confirmation token is invalid or expired')
    const user = await context.internalAdapter.updateUser(verification.value, {
      emailVerified: true,
    })
    return this.toAuthUser(user)
  }

  private async storeToken(
    prefix: string,
    redirectTo: string,
    userId: string,
    expiresAt: Date,
    parameter: 'confirmationToken' | 'token',
  ): Promise<string> {
    const context = await this.auth.$context
    const url = new URL(redirectTo)
    const token = url.searchParams.get(parameter) ?? randomBytes(32).toString('base64url')
    url.searchParams.set(parameter, token)
    const identifier = `${prefix}${token}`
    await context.internalAdapter.deleteVerificationByIdentifier(identifier)
    await context.internalAdapter.createVerificationValue({
      identifier,
      value: userId,
      expiresAt,
    })
    return url.toString()
  }

  private async requireUser(id: string) {
    const user = await this.auth.$context.then((context) =>
      context.internalAdapter.findUserById(id),
    )
    if (!user) throw new AuthenticationAccountUnavailableError()
    return user
  }

  private toAuthUser(user: { id: string; email: string }): AuthUser {
    return { id: user.id, email: user.email }
  }
}
