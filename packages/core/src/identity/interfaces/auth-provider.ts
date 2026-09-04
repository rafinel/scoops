import type { AuthCredentials } from '#identity/domain/structures/auth-credentials.ts'
import type { AuthSession } from '#identity/domain/structures/auth-session.ts'
import type { AuthStateChangeListener } from '#identity/domain/structures/auth-state-change-listener.ts'

export interface AuthProvider {
  signIn(credentials: AuthCredentials): Promise<AuthSession>
  getSession(): Promise<AuthSession | null>
  onAuthStateChange(listener: AuthStateChangeListener): () => void
  signOut(): Promise<void>
}
