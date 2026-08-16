import { Inject, Injectable } from '@nestjs/common'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

import type { AuthUser } from '@scoops/core/identity/domain/structures'
import {
  AuthenticationProviderUnavailableError,
  OnboardingConfirmationRateLimitedError,
  UserInvitationEmailUnavailableError,
  UserInvitationRateLimitedError,
} from '@scoops/core/identity/domain/errors'
import type { ServerAuthProvider } from '@scoops/core/identity/interfaces'

import { EnvProvider } from '@/shared/provision/env/env-provider'

type SupabaseError = {
  code?: string
  status?: number
  message?: string
}

@Injectable()
export class SupabaseServerAuthProvider implements ServerAuthProvider {
  private readonly anonClient: SupabaseClient
  private readonly serviceClient: SupabaseClient

  constructor(@Inject(EnvProvider) envProvider: EnvProvider) {
    const options = {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
    const supabaseUrl = envProvider.get('SUPABASE_URL')

    this.anonClient = createClient(
      supabaseUrl,
      envProvider.get('SUPABASE_ANON_KEY'),
      options,
    )
    this.serviceClient = createClient(
      supabaseUrl,
      envProvider.get('SUPABASE_SERVICE_ROLE_KEY'),
      options,
    )
  }

  async verifyAccessToken(accessToken: string): Promise<AuthUser | undefined> {
    try {
      const { data, error } = await this.anonClient.auth.getUser(accessToken)

      if (error) {
        if (this.isInvalidTokenError(error)) return undefined
        throw new AuthenticationProviderUnavailableError()
      }

      if (!data.user) return undefined

      return {
        id: data.user.id,
        email: data.user.email ?? '',
      }
    } catch (error) {
      if (error instanceof AuthenticationProviderUnavailableError) throw error

      throw new AuthenticationProviderUnavailableError()
    }
  }

  async registerPendingIdentity(input: {
    email: string
    password: string
    confirmationRedirectTo: string
  }): Promise<{ providerSubject: string } | undefined> {
    try {
      const { data, error } = await this.anonClient.auth.signUp({
        email: input.email,
        password: input.password,
        options: { emailRedirectTo: input.confirmationRedirectTo },
      })

      if (error) return this.mapSignupError(error)
      if (!this.isUsableSignupUser(data.user)) return undefined

      return { providerSubject: data.user.id }
    } catch (error) {
      this.rethrowKnownOnboardingError(error)
      throw new AuthenticationProviderUnavailableError()
    }
  }

  async verifyPendingPassword(input: {
    email: string
    password: string
  }): Promise<boolean> {
    try {
      const { error } = await this.anonClient.auth.signInWithPassword(input)

      if (!error) {
        await this.anonClient.auth.signOut({ scope: 'local' }).catch(() => undefined)
        return false
      }

      if (error.code === 'email_not_confirmed') return true
      if (this.isCredentialError(error)) return false

      throw new AuthenticationProviderUnavailableError()
    } catch (error) {
      if (error instanceof AuthenticationProviderUnavailableError) throw error

      throw new AuthenticationProviderUnavailableError()
    }
  }

  async resendConfirmation(input: {
    email: string
    confirmationRedirectTo: string
  }): Promise<void> {
    try {
      const { error } = await this.anonClient.auth.resend({
        type: 'signup',
        email: input.email,
        options: { emailRedirectTo: input.confirmationRedirectTo },
      })

      if (error) this.mapOnboardingTransportError(error)
    } catch (error) {
      this.rethrowKnownOnboardingError(error)
      throw new AuthenticationProviderUnavailableError()
    }
  }

  async registerReplacementIdentity(input: {
    currentEmail: string
    email: string
    password: string
    confirmationRedirectTo: string
  }): Promise<{ providerSubject: string } | undefined> {
    const isCurrentPasswordValid = await this.verifyPendingPassword({
      email: input.currentEmail,
      password: input.password,
    })

    if (!isCurrentPasswordValid) return undefined

    return this.registerPendingIdentity({
      email: input.email,
      password: input.password,
      confirmationRedirectTo: input.confirmationRedirectTo,
    })
  }

  async inviteIdentity(input: {
    email: string
    invitationRedirectTo: string
  }): Promise<{ providerSubject: string } | undefined> {
    try {
      const { data, error } = await this.serviceClient.auth.admin.inviteUserByEmail(
        input.email,
        { redirectTo: input.invitationRedirectTo },
      )

      if (error) this.mapInvitationError(error)

      return this.toProviderSubject(data.user)
    } catch (error) {
      this.rethrowKnownInvitationError(error)
      throw new AuthenticationProviderUnavailableError()
    }
  }

  async correctPendingIdentityEmail(input: {
    providerSubject: string
    email: string
  }): Promise<void> {
    try {
      const { error } = await this.serviceClient.auth.admin.updateUserById(
        input.providerSubject,
        { email: input.email },
      )

      if (error) this.mapInvitationError(error)
    } catch (error) {
      this.rethrowKnownInvitationError(error)
      throw new AuthenticationProviderUnavailableError()
    }
  }

  async resendInvitation(input: {
    email: string
    invitationRedirectTo: string
  }): Promise<void> {
    try {
      const { error } = await this.serviceClient.auth.admin.inviteUserByEmail(
        input.email,
        { redirectTo: input.invitationRedirectTo },
      )

      if (error) this.mapInvitationError(error)
    } catch (error) {
      this.rethrowKnownInvitationError(error)
      throw new AuthenticationProviderUnavailableError()
    }
  }

  async getIdentityEmail(providerSubject: string): Promise<string | undefined> {
    try {
      const { data, error } =
        await this.serviceClient.auth.admin.getUserById(providerSubject)

      if (error) {
        if (this.isMissingIdentityError(error)) return undefined
        this.mapInvitationError(error)
      }

      return data.user?.email ?? undefined
    } catch (error) {
      this.rethrowKnownInvitationError(error)
      throw new AuthenticationProviderUnavailableError()
    }
  }

  async removeIdentity(providerSubject: string): Promise<void> {
    try {
      const { error } = await this.serviceClient.auth.admin.deleteUser(providerSubject)

      if (!error || this.isMissingIdentityError(error)) return

      throw new AuthenticationProviderUnavailableError()
    } catch (error) {
      if (error instanceof AuthenticationProviderUnavailableError) throw error

      throw new AuthenticationProviderUnavailableError()
    }
  }

  private isInvalidTokenError(error: SupabaseError): boolean {
    return (
      error.status === 401 ||
      error.code === 'bad_jwt' ||
      error.code === 'invalid_credentials' ||
      error.code === 'session_not_found' ||
      error.code === 'user_not_found'
    )
  }

  private isUsableSignupUser(user: User | null): user is User {
    return Boolean(user?.id && (user.identities?.length ?? 0) > 0)
  }

  private mapSignupError(error: SupabaseError): undefined {
    this.mapOnboardingTransportError(error)
    return undefined
  }

  private mapOnboardingTransportError(error: SupabaseError): void {
    if (this.isRateLimitError(error)) {
      throw new OnboardingConfirmationRateLimitedError()
    }
    if (this.isUnavailableError(error)) {
      throw new AuthenticationProviderUnavailableError()
    }
    if (this.isOnboardingCollisionError(error)) return

    throw new AuthenticationProviderUnavailableError()
  }

  private mapInvitationError(error: SupabaseError): void {
    if (this.isRateLimitError(error)) throw new UserInvitationRateLimitedError()
    if (this.isInvitationCollisionError(error)) {
      throw new UserInvitationEmailUnavailableError()
    }

    throw new AuthenticationProviderUnavailableError()
  }

  private rethrowKnownOnboardingError(error: unknown): void {
    if (
      error instanceof AuthenticationProviderUnavailableError ||
      error instanceof OnboardingConfirmationRateLimitedError
    ) {
      throw error
    }
  }

  private rethrowKnownInvitationError(error: unknown): void {
    if (
      error instanceof AuthenticationProviderUnavailableError ||
      error instanceof UserInvitationRateLimitedError ||
      error instanceof UserInvitationEmailUnavailableError
    ) {
      throw error
    }
  }

  private isOnboardingCollisionError(error: SupabaseError): boolean {
    return (
      error.code === 'user_already_exists' ||
      error.code === 'email_exists' ||
      error.code === 'signup_disabled'
    )
  }

  private isInvitationCollisionError(error: SupabaseError): boolean {
    return (
      error.code === 'user_already_exists' ||
      error.code === 'email_exists' ||
      error.code === 'email_address_invalid' ||
      error.status === 422
    )
  }

  private isCredentialError(error: SupabaseError): boolean {
    return (
      error.code === 'invalid_credentials' ||
      error.code === 'user_not_found' ||
      error.status === 400 ||
      error.status === 401
    )
  }

  private isMissingIdentityError(error: SupabaseError): boolean {
    return error.code === 'user_not_found' || error.status === 404
  }

  private isRateLimitError(error: SupabaseError): boolean {
    return error.status === 429 || error.code === 'over_email_send_rate_limit'
  }

  private isUnavailableError(error: SupabaseError): boolean {
    return typeof error.status === 'number' && error.status >= 500
  }

  private toProviderSubject(user: User | null): { providerSubject: string } | undefined {
    return user?.id ? { providerSubject: user.id } : undefined
  }
}
