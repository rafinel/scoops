import { Fragment } from 'react'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { SidebarItem } from '@/constants/sidebar-items'
import { useSidebarNavigation } from './use-sidebar-navigation'

export type SidebarNavigationProps = {
  ariaLabel?: string
  className?: string
  items: readonly SidebarItem[]
  onNavigate?: () => void
  pathname: string
}

export const SidebarNavigation = ({
  ariaLabel,
  className = 'mt-14 space-y-1',
  items,
  onNavigate,
  pathname,
}: SidebarNavigationProps) => {
  const { navigationItems } = useSidebarNavigation({ items, pathname })

  return (
    <nav aria-label={ariaLabel} className={className}>
      {navigationItems.map((item) => (
        <Fragment key={item.route}>
          {item.hasDividerBefore && (
            <div className='px-3.5 py-1.5'>
              <hr className='h-px border-0 bg-border' />
            </div>
          )}
          {item.groupLabel && (
            <p className='px-3.5 pt-2.5 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground'>
              {item.groupLabel}
            </p>
          )}
          <Anchor
            aria-current={item.ariaCurrent}
            className={item.className}
            onClick={onNavigate}
            route={item.route}
          >
            <Icon className='size-[18px]' name={item.icon} />
            {item.label}
          </Anchor>
        </Fragment>
      ))}
    </nav>
  )
}
