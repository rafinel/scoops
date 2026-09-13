import { Anchor } from '@/ui/shared/widgets/components/anchor'

export type NotificationDropdownFooterProps = {
  onOpenAll: () => void
}

export const NotificationDropdownFooter = ({
  onOpenAll,
}: NotificationDropdownFooterProps) => (
  <footer className='shrink-0 border-t border-border-soft px-5 py-4 text-center'>
    <Anchor
      className='text-sm font-extrabold text-primary underline-offset-4 hover:underline'
      onClick={onOpenAll}
      route='notifications'
    >
      Ver todas as notificações
    </Anchor>
  </footer>
)
