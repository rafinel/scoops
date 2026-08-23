import type { Account } from '@scoops/core/identity/domain/entities'

import { useLogoutAction } from '@/ui/identity/hooks/use-logout-action'
import { showErrorToast } from '@/ui/shared/notifications'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { getSidebarItems, SIDEBAR_SECONDARY_ITEMS } from '@/constants/sidebar-items'

export function useAppLayout() {
  const { account } = useAuthContext()
  const { error, isPending, logout } = useLogoutAction()

  async function handleLogout(): Promise<void> {
    try {
      await logout()
    } catch (caught) {
      showErrorToast(
        caught instanceof Error ? caught.message : 'Não foi possível sair agora.',
      )
    }
  }

  return {
    account: account as Account | null,
    error,
    isPending,
    handleLogout,
    primaryItems: getSidebarItems(account?.profile ?? null),
    secondaryItems: getSidebarItems(account?.profile ?? null, SIDEBAR_SECONDARY_ITEMS),
  }
}
