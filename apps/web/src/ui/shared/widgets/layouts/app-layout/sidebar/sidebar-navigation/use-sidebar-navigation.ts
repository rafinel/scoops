import type { SidebarItem } from '@/constants/sidebar-items'
import { isSidebarItemActive } from './is-sidebar-item-active'

const ITEM_CLASS =
  'flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-extrabold transition-colors'
const ACTIVE_ITEM_CLASS = 'bg-accent text-primary'
const INACTIVE_ITEM_CLASS = 'text-foreground hover:bg-muted hover:text-foreground'

export type UseSidebarNavigationProps = {
  items: readonly SidebarItem[]
  pathname: string
}

function getStartingGroup(items: readonly SidebarItem[], index: number) {
  const group = items[index]?.group
  return group === items[index - 1]?.group ? undefined : group
}

function getItemClassName(isActive: boolean) {
  return `${ITEM_CLASS} ${isActive ? ACTIVE_ITEM_CLASS : INACTIVE_ITEM_CLASS}`
}

function buildNavigationItem(
  item: SidebarItem,
  index: number,
  { items, pathname }: UseSidebarNavigationProps,
) {
  const isActive = isSidebarItemActive(pathname, item)
  const startingGroup = getStartingGroup(items, index)
  return {
    ...item,
    startingGroup,
    hasDividerBefore: startingGroup !== undefined && index > 0,
    ariaCurrent: isActive ? ('page' as const) : undefined,
    className: getItemClassName(isActive),
  }
}

export function useSidebarNavigation(props: UseSidebarNavigationProps) {
  const navigationItems = props.items.map((item, index) =>
    buildNavigationItem(item, index, props),
  )

  return { navigationItems }
}
