import type { AuthUser } from '@scoops/core/identity/domain/structures'
import type { AuthIdentityProvider } from '@scoops/core/identity/interfaces'

import { AuthenticationProviderUnavailableError } from '@/identity/provision/errors'

export class TestAuthIdentityProvider implements AuthIdentityProvider {
  private readonly usersByToken = new Map<string, AuthUser>()
  private isUnavailable = false

  setUser(accessToken: string, user: AuthUser) {
    this.usersByToken.set(accessToken, user)
  }

  setUnavailable(isUnavailable: boolean) {
    this.isUnavailable = isUnavailable
  }

  clear() {
    this.usersByToken.clear()
    this.isUnavailable = false
  }

  async verifyAccessToken(accessToken: string): Promise<AuthUser | undefined> {
    if (this.isUnavailable) throw new AuthenticationProviderUnavailableError()

    return this.usersByToken.get(accessToken)
  }
}
