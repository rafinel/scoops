import { UserProfile } from '@scoops/core/identity/domain/structures'

import type { UserMenuProps } from './types/user-menu-props'

export function useUserMenu({ account, onLogout }: UserMenuProps) {
  const profileLabel = account.profile === UserProfile.Manager ? 'Gerente' : 'Operador'

  function handleLogout() {
    void onLogout()
  }

  return { profileLabel, handleLogout }
}
