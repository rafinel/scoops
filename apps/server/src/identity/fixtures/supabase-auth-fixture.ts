import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

import type { AuthUser } from '@scoops/core/identity/domain/structures'
import type { ServerAuthProvider } from '@scoops/core/identity/interfaces'

import { SupabaseServerAuthProvider } from '@/identity/provision/supabase/supabase-server-auth-provider'
import type { EnvProvider } from '@/shared/provision/env/env-provider'

type SupabaseAuthFixtureOptions = {
  url?: string
  anonKey?: string
  serviceRoleKey?: string
}

type CreateUserInput = {
  email: string
  password?: string
  userMetadata?: Record<string, unknown>
}

type PendingToken = {
  accessToken: string
  user: AuthUser
}

export class SupabaseAuthFixture implements ServerAuthProvider {
  private readonly anonClient: SupabaseClient
  private readonly adminClient: SupabaseClient
  private readonly provider: SupabaseServerAuthProvider
  private readonly createdUserIds = new Set<string>()
  private readonly pendingTokens = new Map<string, Promise<PendingToken>>()
  private readonly providerEmails = new Map<string, string>()
  private readonly providerSubjects = new Map<string, string>()
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

  constructor(options: SupabaseAuthFixtureOptions = {}) {
    const url = options.url ?? process.env.SUPABASE_URL
    const anonKey = options.anonKey ?? process.env.SUPABASE_ANON_KEY
    const serviceRoleKey = options.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error(
        'Supabase-backed tests require SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.',
      )
    }

    const clientOptions = {
      auth: { autoRefreshToken: false, persistSession: false },
    }

    this.anonClient = createClient(url, anonKey, clientOptions)
    this.adminClient = createClient(url, serviceRoleKey, clientOptions)
    this.provider = new SupabaseServerAuthProvider({
      get(key: string) {
        const values: Record<string, string> = {
          SUPABASE_URL: url,
          SUPABASE_ANON_KEY: anonKey,
          SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
        }

        return values[key]
      },
    } as EnvProvider)
  }

  async createUser(input: CreateUserInput) {
    const { data, error } = await this.adminClient.auth.admin.createUser({
      email: input.email,
      email_confirm: true,
      password: input.password ?? 'Password123!',
      user_metadata: input.userMetadata,
    })

    if (error) throw error
    if (!data.user) throw new Error('Supabase did not return the created user.')

    this.createdUserIds.add(data.user.id)
    return data.user
  }

  async signIn(email: string, password = 'Password123!') {
    const { data, error } = await this.anonClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.user || !data.session) {
      throw new Error('Supabase did not return a user session.')
    }

    return {
      accessToken: data.session.access_token,
      user: data.user,
    }
  }

  async createSignedInUser(input: CreateUserInput) {
    const user = await this.createUser(input)
    const session = await this.signIn(input.email, input.password)

    return { ...session, user }
  }

  async createUnconfirmedUser(input: CreateUserInput) {
    const providerEmail = this.toProviderEmail(input.email)
    const { data, error } = await this.adminClient.auth.admin.createUser({
      email: providerEmail,
      password: input.password ?? 'Password123!',
      email_confirm: false,
    })

    if (error) throw error
    if (!data.user) throw new Error('Supabase did not return the created user.')

    this.createdUserIds.add(data.user.id)
    return data.user
  }

  setUser(accessToken: string, user: AuthUser) {
    this.pendingTokens.set(
      accessToken,
      this.createSignedInUser({ email: this.toProviderEmail(user.email) })
        .then((session) => ({
          accessToken: session.accessToken,
          user,
        }))
        .catch((error) => {
          throw error
        }),
    )
  }

  async verifyAccessToken(accessToken: string) {
    const pendingToken = this.pendingTokens.get(accessToken)

    if (pendingToken) {
      const token = await pendingToken
      const verifiedUser = await this.provider.verifyAccessToken(token.accessToken)

      if (verifiedUser) this.providerSubjects.set(token.user.id, verifiedUser.id)
      return verifiedUser ? token.user : undefined
    }

    return this.provider.verifyAccessToken(accessToken)
  }

  async registerPendingIdentity(
    input: Parameters<ServerAuthProvider['registerPendingIdentity']>[0],
  ) {
    this.calls.registerPendingIdentity.push([input])
    const result = await this.provider.registerPendingIdentity({
      ...input,
      email: this.toProviderEmail(input.email),
    })
    if (result) this.createdUserIds.add(result.providerSubject)
    return result
  }

  verifyPendingPassword(
    input: Parameters<ServerAuthProvider['verifyPendingPassword']>[0],
  ) {
    return this.provider.verifyPendingPassword({
      ...input,
      email: this.toProviderEmail(input.email),
    })
  }

  resendConfirmation(input: Parameters<ServerAuthProvider['resendConfirmation']>[0]) {
    this.calls.resendConfirmation.push([input])
    return this.provider.resendConfirmation({
      ...input,
      email: this.toProviderEmail(input.email),
    })
  }

  async registerReplacementIdentity(
    input: Parameters<ServerAuthProvider['registerReplacementIdentity']>[0],
  ) {
    this.calls.registerReplacementIdentity.push([input])
    const result = await this.provider.registerReplacementIdentity({
      ...input,
      currentEmail: this.toProviderEmail(input.currentEmail),
      email: this.toProviderEmail(input.email),
    })
    if (result) this.createdUserIds.add(result.providerSubject)
    return result
  }

  async inviteIdentity(input: Parameters<ServerAuthProvider['inviteIdentity']>[0]) {
    this.calls.inviteIdentity.push([input])
    const result = await this.provider.inviteIdentity({
      ...input,
      email: this.toProviderEmail(input.email),
    })
    if (result) this.createdUserIds.add(result.providerSubject)
    return result
  }

  async correctPendingIdentityEmail(
    input: Parameters<ServerAuthProvider['correctPendingIdentityEmail']>[0],
  ) {
    this.calls.correctPendingIdentityEmail.push([input])
    const providerSubject = await this.ensureProviderSubject(input.providerSubject)

    return this.provider.correctPendingIdentityEmail({
      ...input,
      providerSubject,
      email: this.toProviderEmail(input.email),
    })
  }

  resendInvitation(input: Parameters<ServerAuthProvider['resendInvitation']>[0]) {
    this.calls.resendInvitation.push([input])
    return this.provider.resendInvitation({
      ...input,
      email: this.toProviderEmail(input.email),
    })
  }

  getIdentityEmail(providerSubject: string) {
    this.calls.getIdentityEmail.push([providerSubject])
    return this.provider.getIdentityEmail(
      this.providerSubjects.get(providerSubject) ?? providerSubject,
    )
  }

  async removeIdentity(providerSubject: string) {
    this.calls.removeIdentity.push([providerSubject])
    const actualProviderSubject =
      this.providerSubjects.get(providerSubject) ?? providerSubject
    await this.provider.removeIdentity(actualProviderSubject)
    this.createdUserIds.delete(actualProviderSubject)
    this.providerSubjects.delete(providerSubject)
  }

  getCalls() {
    return this.calls
  }

  async clear() {
    await Promise.allSettled(this.pendingTokens.values())

    for (const userId of this.createdUserIds) {
      await this.deleteUser(userId)
    }

    this.pendingTokens.clear()
    this.providerEmails.clear()
    this.providerSubjects.clear()
    this.clearCalls()
  }

  async close() {
    await this.clear()
  }

  private async deleteUser(userOrId: Pick<User, 'id'> | string) {
    const userId = typeof userOrId === 'string' ? userOrId : userOrId.id
    const { error } = await this.adminClient.auth.admin.deleteUser(userId)

    if (error && !error.message.toLowerCase().includes('not found')) throw error
    this.createdUserIds.delete(userId)
  }

  private clearCalls() {
    this.calls.registerPendingIdentity.length = 0
    this.calls.resendConfirmation.length = 0
    this.calls.registerReplacementIdentity.length = 0
    this.calls.inviteIdentity.length = 0
    this.calls.correctPendingIdentityEmail.length = 0
    this.calls.resendInvitation.length = 0
    this.calls.getIdentityEmail.length = 0
    this.calls.removeIdentity.length = 0
  }

  private toProviderEmail(email: string) {
    const existingEmail = this.providerEmails.get(email)
    if (existingEmail) return existingEmail

    const [localPart, domain = 'example.com'] = email.split('@')
    const providerEmail = `${localPart}+${randomUUID()}@${domain}`
    this.providerEmails.set(email, providerEmail)
    return providerEmail
  }

  private async ensureProviderSubject(providerSubject: string) {
    const existingSubject = this.providerSubjects.get(providerSubject)
    if (existingSubject) return existingSubject

    const user = await this.createUser({
      email: `provider-${providerSubject}@example.com`,
    })
    this.providerSubjects.set(providerSubject, user.id)
    return user.id
  }
}
