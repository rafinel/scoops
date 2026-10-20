import type { SidebarItem } from '@/constants/sidebar-items'
import { SidebarNavigationItem } from './sidebar-navigation-item'
import { useSidebarNavigation } from './use-sidebar-navigation'

const DEFAULT_CLASS_NAME = 'mt-14 space-y-1'

export type SidebarNavigationProps = {
  ariaLabel?: string
  className?: string
  items: readonly SidebarItem[]
  onNavigate?: () => void
  pathname: string
}

export const SidebarNavigation = (props: SidebarNavigationProps) => {
  const { navigationItems } = useSidebarNavigation(props)

  return (
    <nav aria-label={props.ariaLabel} className={props.className ?? DEFAULT_CLASS_NAME}>
      {navigationItems.map((item) => (
        <SidebarNavigationItem
          item={item}
          key={item.route}
          onNavigate={props.onNavigate}
        />
      ))}
    </nav>
  )
}
