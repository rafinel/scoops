import { createHash, randomBytes, randomUUID } from 'node:crypto'

import {
  OnboardingConfirmationPreparedEvent,
  PasswordRecoveryPreparedEvent,
  UserInvitationPreparedEvent,
} from '@scoops/core/identity/domain/events'
import type { AuthSession, AuthUser } from '@scoops/core/identity/domain/structures'
import {
  AuthenticationAccountUnavailableError,
  AuthenticationSessionExpiredError,
} from '@scoops/core/identity/domain/errors'
import { BadRequestError } from '@scoops/core/shared/domain/errors'
import type { ServerAuthProvider } from '@scoops/core/identity/interfaces'
import type { Response } from 'express'

type VerifiedFixtureSession = {
  session: AuthSession
  token: string
}

type FixtureUser = AuthUser & { name: string; password?: string; verified: boolean }
type StoredToken = { userId: string; expiresAt: Date; kind: string }
type CreateFixtureUserInput = {
  id?: string
  email: string
  password?: string
  name?: string
}

const TOKEN_LIFETIME = 7 * 24 * 60 * 60 * 1000

export class BetterAuthFixture implements ServerAuthProvider {
  private readonly users = new Map<string, FixtureUser>()
  private readonly tokens = new Map<string, StoredToken>()
  private readonly sessions = new Map<string, string>()
  private latestSessionToken = ''
  private readonly calls = {
    registerPendingIdentity: [] as Array<
      Parameters<ServerAuthProvider['registerPendingIdentity']>
    >,
    registerReplacementIdentity: [] as Array<
      [
        {
          currentEmail: string
          email: string
          password: string
          confirmationRedirectTo: string
        },
      ]
    >,
    resendConfirmation: [] as Array<[{ email: string; confirmationRedirectTo: string }]>,
    inviteIdentity: [] as Array<Parameters<ServerAuthProvider['inviteIdentity']>>,
    correctPendingIdentity: [] as Array<
      Parameters<ServerAuthProvider['correctPendingIdentity']>
    >,
    prepareInvitationResend: [] as Array<
      Parameters<ServerAuthProvider['prepareInvitationResend']>
    >,
  }

  async registerPendingIdentity(input: {
    email: string
    password: string
    name: string
    confirmationRedirectTo: string
  }) {
    this.calls.registerPendingIdentity.push([input])
    const user = this.createUser(input.email, input.name, input.password)
    this.suppressResendTracking = true
    try {
      return {
        authUser: this.toAuthUser(user),
        event: await this.prepareOnboardingConfirmation({
          providerSubject: user.id,
          confirmationRedirectTo: input.confirmationRedirectTo,
        }),
      }
    } finally {
      this.suppressResendTracking = false
    }
  }

  private suppressResendTracking = false

  prepareOnboardingConfirmation(input: {
    providerSubject: string
    confirmationRedirectTo: string
  }) {
    const user = this.requireUser(input.providerSubject)
    if (!this.suppressResendTracking) {
      this.calls.resendConfirmation.push([
        { email: user.email, confirmationRedirectTo: input.confirmationRedirectTo },
      ])
    }
    const { token, actionUrl } = this.prepareActionToken(
      input.confirmationRedirectTo,
      'confirmationToken',
      'onboarding',
      user.id,
    )
    return Promise.resolve(
      new OnboardingConfirmationPreparedEvent({
        userId: user.id,
        email: user.email,
        name: user.name,
        actionUrl,
        expiresAt: this.tokens.get(token)?.expiresAt.toISOString() ?? '',
        occurredAt: new Date().toISOString(),
      }),
    )
  }

  inspectOnboardingConfirmation(token: string) {
    return Promise.resolve(this.inspectToken('onboarding', token))
  }

  completeOnboardingConfirmation(token: string) {
    return Promise.resolve(this.completeToken('onboarding', token))
  }

  async replacePendingIdentity(input: {
    providerSubject: string
    email: string
    password: string
    name: string
    confirmationRedirectTo: string
  }) {
    const currentEmail = this.requireUser(input.providerSubject).email
    this.calls.registerReplacementIdentity.push([
      {
        currentEmail,
        email: input.email,
        password: input.password,
        confirmationRedirectTo: input.confirmationRedirectTo,
      },
    ])
    const user = this.createUser(input.email, input.name, input.password)
    user.verified = false
    this.suppressResendTracking = true
    try {
      return {
        authUser: this.toAuthUser(user),
        event: await this.prepareOnboardingConfirmation({
          providerSubject: user.id,
          confirmationRedirectTo: input.confirmationRedirectTo,
        }),
      }
    } finally {
      this.suppressResendTracking = false
    }
  }

  removeIdentity(providerSubject: string) {
    this.users.delete(providerSubject)
    return Promise.resolve()
  }

  async inviteIdentity(input: {
    establishmentId: string
    email: string
    name: string
    invitationRedirectTo: string
  }) {
    this.calls.inviteIdentity.push([input])
    const user = this.createUser(input.email, input.name)
    return {
      authUser: this.toAuthUser(user),
      event: await this.prepareInvitation({
        providerSubject: user.id,
        establishmentId: input.establishmentId,
        invitationRedirectTo: input.invitationRedirectTo,
        operation: 'initial',
      }),
    }
  }

  async correctPendingIdentity(input: {
    providerSubject: string
    establishmentId: string
    email: string
    name: string
    invitationRedirectTo: string
  }) {
    this.calls.correctPendingIdentity.push([input])
    const user =
      this.users.get(input.providerSubject) ??
      this.createUserWithId(input.providerSubject, input.email, input.name)
    user.email = input.email.trim().toLowerCase()
    user.name = input.name.trim()
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
    this.calls.prepareInvitationResend.push([input])
    if (!this.users.has(input.providerSubject)) {
      this.createUserWithId(input.providerSubject, 'pending@example.com', 'Pending User')
    }
    return this.prepareInvitation({ ...input, operation: 'resent' })
  }

  setInvitationPassword(input: { providerSubject: string; password: string }) {
    const user = this.requireUser(input.providerSubject)
    user.password = input.password
    user.verified = true
    return Promise.resolve(this.toAuthUser(user))
  }

  getIdentityEmail(providerSubject: string) {
    return Promise.resolve(this.users.get(providerSubject)?.email)
  }

  revokeSessions(providerSubject: string) {
    for (const [token, userId] of this.sessions) {
      if (userId === providerSubject) this.sessions.delete(token)
    }
    return Promise.resolve()
  }

  async preparePasswordRecovery(input: {
    providerSubject: string
    recoveryRedirectTo: string
  }) {
    const user =
      this.users.get(input.providerSubject) ??
      this.createUserWithId(
        input.providerSubject,
        'recovery@example.com',
        'Recovery User',
      )
    const { token, actionUrl } = this.prepareActionToken(
      input.recoveryRedirectTo,
      'token',
      'recovery',
      user.id,
      60 * 60 * 1000,
    )
    return new PasswordRecoveryPreparedEvent({
      userId: user.id,
      email: user.email,
      name: user.name,
      actionUrl,
      expiresAt: this.tokens.get(token)?.expiresAt.toISOString() ?? '',
      occurredAt: new Date().toISOString(),
    })
  }

  async resetPassword(input: { token: string; password: string }) {
    const user = this.completeToken('recovery', input.token)
    user.password = input.password
    user.verified = true
    await this.revokeSessions(user.id)
    return this.toAuthUser(user)
  }

  setUser(sessionToken: string, user: AuthUser) {
    this.users.set(user.id, { ...user, name: user.email, verified: true })
    this.sessions.set(sessionToken, user.id)
    this.latestSessionToken = sessionToken
  }

  async createUnconfirmedUser(input: CreateFixtureUserInput) {
    const existing = [...this.users.values()].find(
      (user) => user.email === input.email.trim().toLowerCase(),
    )
    if (existing) {
      existing.password = input.password
      existing.verified = false
      return existing
    }
    return this.createUser(
      input.email,
      input.name ?? input.email,
      input.password,
      input.id,
    )
  }

  registerOnboardingConfirmation(confirmationToken: string, providerSubject: string) {
    this.tokens.set(confirmationToken, {
      kind: 'onboarding',
      userId: providerSubject,
      expiresAt: new Date(Date.now() + TOKEN_LIFETIME),
    })
  }

  async verify(headers: { cookie?: string }): Promise<VerifiedFixtureSession> {
    const cookie = headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('scoops.session_token='))
    const token = cookie?.slice('scoops.session_token='.length)
    const userId = token ? this.sessions.get(token) : undefined
    const user = userId ? this.users.get(userId) : undefined
    if (!token || !user) throw new AuthenticationSessionExpiredError()

    const createdAt = new Date()
    return {
      token,
      session: {
        sessionId: token,
        user: this.toAuthUser(user),
        createdAt,
        expiresAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
        absoluteExpiresAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    }
  }

  issueForUser(providerSubject: string, response: Response) {
    const sessionToken = `fixture-session-${providerSubject}`
    const user = this.requireUser(providerSubject)
    this.sessions.set(sessionToken, user.id)
    this.latestSessionToken = sessionToken
    response.setHeader('Set-Cookie', this.cookieFor(sessionToken))
  }

  expireSession(response: Response) {
    if (this.latestSessionToken) this.sessions.delete(this.latestSessionToken)
    response.setHeader('Set-Cookie', 'scoops.session_token=; Max-Age=0; Path=/')
  }

  cookieFor(sessionToken = this.latestSessionToken) {
    return `scoops.session_token=${sessionToken}`
  }

  clear() {
    this.users.clear()
    this.tokens.clear()
    this.sessions.clear()
    this.latestSessionToken = ''
    for (const calls of Object.values(this.calls)) calls.length = 0
  }

  getCalls() {
    return this.calls
  }

  private createUser(email: string, name: string, password?: string, id?: string) {
    const user = {
      id: id ?? randomUUID(),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password,
      verified: false,
    }
    this.users.set(user.id, user)
    return user
  }

  private createUserWithId(id: string, email: string, name: string) {
    return this.createUser(email, name, undefined, id)
  }

  private prepareInvitation(input: {
    providerSubject: string
    establishmentId: string
    invitationRedirectTo: string
    operation: 'initial' | 'corrected' | 'resent'
  }) {
    const user = this.requireUser(input.providerSubject)
    const { token, actionUrl } = this.prepareActionToken(
      input.invitationRedirectTo,
      'confirmationToken',
      'invitation',
      user.id,
    )
    return Promise.resolve(
      new UserInvitationPreparedEvent({
        userId: user.id,
        establishmentId: input.establishmentId,
        email: user.email,
        name: user.name,
        actionUrl,
        expiresAt: this.tokens.get(token)?.expiresAt.toISOString() ?? '',
        occurredAt: new Date().toISOString(),
        operation: input.operation,
      }),
    )
  }

  private issueToken(kind: string, userId: string, lifetime: number) {
    const token = randomBytes(32).toString('base64url')
    this.tokens.set(token, {
      kind,
      userId,
      expiresAt: new Date(Date.now() + lifetime),
    })
    return token
  }

  private prepareActionToken(
    redirectTo: string,
    parameter: 'confirmationToken' | 'token',
    kind: string,
    userId: string,
    lifetime = TOKEN_LIFETIME,
  ) {
    const url = new URL(redirectTo)
    const token =
      url.searchParams.get(parameter) ?? this.issueToken(kind, userId, lifetime)
    if (!this.tokens.has(token)) {
      this.tokens.set(token, {
        kind,
        userId,
        expiresAt: new Date(Date.now() + lifetime),
      })
    }
    url.searchParams.set(parameter, token)
    return { token, actionUrl: url.toString() }
  }

  private inspectToken(kind: string, token: string) {
    const stored = this.tokens.get(token)
    if (!stored || stored.kind !== kind || stored.expiresAt <= new Date())
      return undefined
    return this.users.get(stored.userId)
  }

  private completeToken(kind: string, token: string) {
    const user = this.inspectToken(kind, token)
    if (!user) throw new BadRequestError('Authentication token is invalid or expired')
    this.tokens.delete(token)
    return user
  }

  private requireUser(providerSubject: string) {
    const user = this.users.get(providerSubject)
    if (!user) throw new AuthenticationAccountUnavailableError()
    return user
  }

  private toAuthUser(user: FixtureUser): AuthUser {
    return { id: user.id, email: user.email }
  }
}

export function hashFixtureToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
