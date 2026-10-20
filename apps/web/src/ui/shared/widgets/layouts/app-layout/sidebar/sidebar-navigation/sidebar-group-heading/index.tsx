import { SIDEBAR_GROUP_LABELS, type SidebarGroup } from '@/constants/sidebar-items'

export type SidebarGroupHeadingProps = {
  group?: SidebarGroup
  hasDividerBefore: boolean
}

export const SidebarGroupHeading = ({
  group,
  hasDividerBefore,
}: SidebarGroupHeadingProps) => (
  <>
    {hasDividerBefore && (
      <div className='px-3.5 py-1.5'>
        <hr className='h-px border-0 bg-border' />
      </div>
    )}
    {group && (
      <p className='px-3.5 pt-2.5 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground'>
        {SIDEBAR_GROUP_LABELS[group]}
      </p>
    )}
  </>
)
