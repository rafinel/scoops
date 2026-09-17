import type { ReactNode } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type MobileSidebarProps = {
  children: ReactNode
  onOpenChange: (open: boolean) => void
  open: boolean
}

export const MobileSidebar = ({ children, onOpenChange, open }: MobileSidebarProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      aria-describedby={undefined}
      className='inset-y-0 left-0 flex h-dvh w-[min(20rem,calc(100%-1rem))] max-w-none translate-x-0 translate-y-0 flex-col rounded-r-2xl rounded-l-none p-5 lg:hidden sm:max-w-none'
      showCloseButton={false}
    >
      <DialogTitle className='sr-only'>Menu principal</DialogTitle>
      <DialogClose
        render={
          <Button
            aria-label='Fechar menu'
            className='absolute top-4 right-4'
            size='icon'
            type='button'
            variant='ghost'
          />
        }
      >
        <Icon name='x' />
      </DialogClose>
      <div className='min-h-0 flex-1 overflow-y-auto'>{children}</div>
    </DialogContent>
  </Dialog>
)
