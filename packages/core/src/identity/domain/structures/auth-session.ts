import type { AuthUser } from '#identity/domain/structures/auth-user.ts'

export type AuthSession = {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  sessionId?: string
  user: AuthUser
}
