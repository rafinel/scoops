import type { ReactNode } from 'react'

import { Button } from '@/ui/shadcn/button'
import { NotificationDropdown } from '@/ui/communication/widgets/components/notification-dropdown'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { GlobalSearch } from '@/ui/identity/widgets/components/global-search'

export type AppLayoutHeaderProps = {
  isMobileSidebarOpen: boolean
  onOpenMobileSidebar: () => void
  userMenu: ReactNode
}

export const AppLayoutHeader = ({
  isMobileSidebarOpen,
  onOpenMobileSidebar,
  userMenu,
}: AppLayoutHeaderProps) => (
  <header className='border-b bg-card'>
    <div className='mx-auto flex min-h-[72px] w-full flex-wrap items-center gap-2 px-4 py-2 sm:flex-nowrap sm:gap-5 sm:px-6 sm:py-0'>
      <GlobalSearch />
      <div className='order-2 flex min-w-0 flex-1 items-center justify-start gap-2 sm:contents'>
        <Button
          aria-expanded={isMobileSidebarOpen}
          aria-label='Abrir menu'
          className='size-10 rounded-lg border text-muted-foreground lg:hidden'
          onClick={onOpenMobileSidebar}
          size='icon'
          type='button'
          variant='outline'
        >
          <Icon className='size-[18px]' name='menu' />
        </Button>
        <NotificationDropdown />
        {userMenu}
      </div>
    </div>
  </header>
)
