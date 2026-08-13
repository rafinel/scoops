import type { AuthIdentityProvider } from '@scoops/core/identity/interfaces'
import type { AuthUser } from '@scoops/core/identity/domain/structures'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Inject, Injectable } from '@nestjs/common'

import { AuthenticationProviderUnavailableError } from '@/identity/provision/errors'
import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class SupabaseAuthIdentityProvider implements AuthIdentityProvider {
  private readonly client: SupabaseClient

  constructor(@Inject(EnvProvider) envProvider: EnvProvider) {
    this.client = createClient(
      envProvider.get('SUPABASE_URL'),
      envProvider.get('SUPABASE_ANON_KEY'),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )
  }

  async verifyAccessToken(accessToken: string): Promise<AuthUser | undefined> {
    try {
      const { data, error } = await this.client.auth.getUser(accessToken)

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

  private isInvalidTokenError(error: { code?: string; status?: number }): boolean {
    return (
      error.status === 401 ||
      error.code === 'bad_jwt' ||
      error.code === 'invalid_credentials' ||
      error.code === 'session_not_found' ||
      error.code === 'user_not_found'
    )
  }
}
