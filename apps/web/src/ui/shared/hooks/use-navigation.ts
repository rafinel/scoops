import { useNavigate } from '@tanstack/react-router'

import { ROUTES, type RouteName } from '@/constants/routes'

export function useNavigation() {
  const navigate = useNavigate()

  function navigateTo(route: RouteName): Promise<void> {
    return navigate({ to: ROUTES[route] })
  }

  return { navigateTo }
}
