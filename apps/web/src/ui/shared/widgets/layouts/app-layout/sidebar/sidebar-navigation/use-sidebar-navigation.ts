import type { SidebarItem } from '@/constants/sidebar-items'
import { isSidebarItemActive } from './is-sidebar-item-active'

export type UseSidebarNavigationProps = {
  items: readonly SidebarItem[]
  pathname: string
}

export function useSidebarNavigation({ items, pathname }: UseSidebarNavigationProps) {
  const navigationItems = items.map((item, index) => {
    const isActive = isSidebarItemActive(pathname, item)
    return {
      ...item,
      hasDividerBefore: index > 0 && item.group !== items[index - 1].group,
      ariaCurrent: isActive ? ('page' as const) : undefined,
      className: `flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-extrabold transition-colors ${isActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-muted hover:text-foreground'}`,
    }
  })

  return { navigationItems }
}
