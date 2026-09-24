import type { Account } from '@scoops/core/identity/domain/entities'

export type UserMenuProps = {
  account: Account
  error: Error | null
  isPending: boolean
  onLogout: () => Promise<void>
}
