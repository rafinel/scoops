import { SIDEBAR_GROUP_LABELS, type SidebarItem } from '@/constants/sidebar-items'
import { isSidebarItemActive } from './is-sidebar-item-active'

export type UseSidebarNavigationProps = {
  items: readonly SidebarItem[]
  pathname: string
}

export function useSidebarNavigation({ items, pathname }: UseSidebarNavigationProps) {
  const navigationItems = items.map((item, index) => {
    const isActive = isSidebarItemActive(pathname, item)
    const startsGroup = item.group !== undefined && item.group !== items[index - 1]?.group
    return {
      ...item,
      groupLabel:
        startsGroup && item.group ? SIDEBAR_GROUP_LABELS[item.group] : undefined,
      hasDividerBefore: startsGroup && index > 0,
      ariaCurrent: isActive ? ('page' as const) : undefined,
      className: `flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-extrabold transition-colors ${isActive ? 'bg-accent text-primary' : 'text-foreground hover:bg-muted hover:text-foreground'}`,
    }
  })

  return { navigationItems }
}
