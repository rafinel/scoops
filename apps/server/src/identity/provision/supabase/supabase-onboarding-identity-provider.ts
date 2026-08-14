import type { OnboardingIdentityProvider } from '@scoops/core/identity/interfaces'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { Inject, Injectable } from '@nestjs/common'

import {
  AuthenticationProviderUnavailableError,
  OnboardingConfirmationRateLimitedError,
} from '@/identity/provision/errors'
import { EnvProvider } from '@/shared/provision/env/env-provider'

type SupabaseError = {
  code?: string
  status?: number
  message?: string
}

@Injectable()
export class SupabaseOnboardingIdentityProvider implements OnboardingIdentityProvider {
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
      if (
        error instanceof AuthenticationProviderUnavailableError ||
        error instanceof OnboardingConfirmationRateLimitedError
      ) {
        throw error
      }
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
      if (error) this.mapTransportError(error)
    } catch (error) {
      if (
        error instanceof AuthenticationProviderUnavailableError ||
        error instanceof OnboardingConfirmationRateLimitedError
      ) {
        throw error
      }
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

  async removeIdentity(providerSubject: string): Promise<void> {
    try {
      const { error } = await this.serviceClient.auth.admin.deleteUser(providerSubject)
      if (!error || this.isMissingIdentityError(error)) return
      this.mapTransportError(error)
    } catch (error) {
      if (
        error instanceof AuthenticationProviderUnavailableError ||
        error instanceof OnboardingConfirmationRateLimitedError
      ) {
        throw error
      }
      throw new AuthenticationProviderUnavailableError()
    }
  }

  private isUsableSignupUser(user: User | null): user is User {
    return Boolean(user?.id && (user.identities?.length ?? 0) > 0)
  }

  private mapSignupError(error: SupabaseError): undefined {
    this.mapTransportError(error)
    return undefined
  }

  private mapTransportError(error: SupabaseError): void {
    if (this.isRateLimitError(error)) throw new OnboardingConfirmationRateLimitedError()
    if (this.isUnavailableError(error)) throw new AuthenticationProviderUnavailableError()
    if (this.isCollisionError(error)) return
    throw new AuthenticationProviderUnavailableError()
  }

  private isCollisionError(error: SupabaseError): boolean {
    return (
      error.code === 'user_already_exists' ||
      error.code === 'email_exists' ||
      error.code === 'signup_disabled'
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
}
