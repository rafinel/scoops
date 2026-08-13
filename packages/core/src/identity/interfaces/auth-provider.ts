import type { AuthCredentials } from '#identity/domain/structures/auth-credentials.ts'
import type { AuthSession } from '#identity/domain/structures/auth-session.ts'
import type { AuthStateChangeListener } from '#identity/domain/structures/auth-state-change-listener.ts'
import type { AuthUser } from '#identity/domain/structures/auth-user.ts'

export interface AuthProvider {
  signIn(credentials: AuthCredentials): Promise<AuthSession>
  getSession(accessToken?: string): Promise<AuthSession | null>
  getUser(accessToken?: string): Promise<AuthUser | null>
  onAuthStateChange(listener: AuthStateChangeListener): () => void
  signOut(scope: 'local' | 'global'): Promise<void>
  requestPasswordReset(email: string, redirectTo: string): Promise<void>
  updatePassword(password: string): Promise<void>
}
