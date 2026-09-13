import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

export type NotificationDropdownHeaderProps = {
  isRefreshing: boolean
  onClose: () => void
}

export const NotificationDropdownHeader = ({
  isRefreshing,
  onClose,
}: NotificationDropdownHeaderProps) => (
  <header className='flex shrink-0 items-center justify-between border-b border-border-soft px-5 py-4'>
    <div className='flex min-w-0 items-center gap-3'>
      <h2 className='text-lg font-extrabold'>Notificações</h2>
      <QueryRefreshStatus isRefreshing={isRefreshing} />
    </div>
    <Button
      aria-label='Fechar notificações'
      className='size-8 rounded-lg text-muted-foreground'
      onClick={onClose}
      size='icon'
      type='button'
      variant='ghost'
    >
      <Icon className='size-4' name='x' />
    </Button>
  </header>
)
