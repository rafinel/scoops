import type { Account } from '@scoops/core/identity/domain/entities'

import { useLogoutAction } from '@/ui/identity/hooks/use-logout-action'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export function useAppLayout() {
  const { account } = useAuthContext()
  const { error, isPending, logout } = useLogoutAction()
  const { navigateTo } = useNavigation()

  async function handleLogout(): Promise<void> {
    try {
      await logout()
      await navigateTo('login')
    } catch {
      // The user menu renders the action error and keeps the shell available.
    }
  }

  return {
    account: account as Account | null,
    error,
    isPending,
    handleLogout,
  }
}
