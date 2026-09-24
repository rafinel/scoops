import { useLocation } from '@tanstack/react-router'

export function useUrlPathname() {
  const { pathname } = useLocation()
  return { pathname }
}
