import type { AuthSession } from '#identity/domain/structures/auth-session.ts'
import type { AuthStateChange } from '#identity/domain/structures/auth-state-change.ts'

export type AuthStateChangeListener = (
  event: AuthStateChange,
  session: AuthSession | null,
) => void
