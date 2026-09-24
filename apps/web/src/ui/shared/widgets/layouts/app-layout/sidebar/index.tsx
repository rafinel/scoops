import type { SidebarItem } from '@/constants/sidebar-items'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { SidebarNavigation } from './sidebar-navigation'

export type AppLayoutSidebarProps = {
  mobile?: boolean
  onNavigate?: () => void
  pathname: string
  primaryItems: readonly SidebarItem[]
  secondaryItems: readonly SidebarItem[]
}

export const AppLayoutSidebar = ({
  mobile = false,
  onNavigate,
  pathname,
  primaryItems,
  secondaryItems,
}: AppLayoutSidebarProps) => (
  <aside
    className={
      mobile
        ? 'flex min-h-full flex-col'
        : 'sticky top-0 hidden h-screen max-h-screen w-[266px] shrink-0 overflow-y-auto border-r border-border bg-card px-5 pb-6 pt-7 lg:flex lg:flex-col'
    }
  >
    <div className='flex items-center gap-3'>
      <span className='grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-primary'>
        <Icon className='size-[22px]' name='ice-cream-bowl' />
      </span>
      <p className='text-xl font-black italic tracking-tight text-primary'>Scoops</p>
    </div>
    <SidebarNavigation
      ariaLabel='Navegação principal'
      className={mobile ? 'mt-8 space-y-1' : undefined}
      items={primaryItems}
      onNavigate={onNavigate}
      pathname={pathname}
    />
    <SidebarNavigation
      className='mt-auto space-y-1 border-t border-border-soft pt-5'
      items={secondaryItems}
      onNavigate={onNavigate}
      pathname={pathname}
    />
  </aside>
)
