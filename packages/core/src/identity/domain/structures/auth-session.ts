import type { AuthUser } from '#identity/domain/structures/auth-user.ts'

export type AuthSession = {
  sessionId: string
  user: AuthUser
  createdAt: Date
  expiresAt: Date
  absoluteExpiresAt: Date
}
