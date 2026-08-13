import type { AuthUser } from '#identity/domain/structures/auth-user.ts'

export interface AuthIdentityProvider {
  verifyAccessToken(accessToken: string): Promise<AuthUser | undefined>
}
