import { Fragment } from 'react'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { SidebarGroup, SidebarItem } from '@/constants/sidebar-items'
import { SidebarGroupHeading } from '../sidebar-group-heading'

export type SidebarNavigationItemProps = {
  item: SidebarItem & {
    ariaCurrent?: 'page'
    className: string
    hasDividerBefore: boolean
    startingGroup?: SidebarGroup
  }
  onNavigate?: () => void
}

export const SidebarNavigationItem = ({
  item,
  onNavigate,
}: SidebarNavigationItemProps) => (
  <Fragment>
    <SidebarGroupHeading
      group={item.startingGroup}
      hasDividerBefore={item.hasDividerBefore}
    />
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
)
