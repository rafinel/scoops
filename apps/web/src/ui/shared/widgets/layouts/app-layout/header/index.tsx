import type { ReactNode } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { NotificationDropdown } from '@/ui/communication/widgets/components/notification-dropdown'
import { Icon } from '@/ui/shared/widgets/components/icon'

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
      <Label className='order-1 flex min-w-0 basis-full items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 sm:order-none sm:flex-1 sm:basis-auto'>
        <Icon className='size-[18px] shrink-0 text-muted-foreground' name='search' />
        <Input
          aria-label='Buscar no Scoops'
          className='h-10 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium shadow-none placeholder:text-muted-foreground focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0'
          placeholder='Buscar no Scoops...'
        />
      </Label>
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
