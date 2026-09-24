import { ROUTES } from '@/constants/routes'
import type { SidebarItem } from '@/constants/sidebar-items'

export function isSidebarItemActive(
  pathname: string,
  item: Pick<SidebarItem, 'route' | 'activePrefixes'>,
): boolean {
  const normalizedPathname = normalizePathname(pathname)
  return [ROUTES[item.route], ...(item.activePrefixes ?? [])].some((route) =>
    isPathActive(normalizedPathname, route),
  )
}

function isPathActive(pathname: string, prefix: string) {
  const normalizedPrefix = normalizePathname(prefix)
  return pathname === normalizedPrefix || pathname.startsWith(`${normalizedPrefix}/`)
}

function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized || '/'
}
