import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type SalesChannelRowActionsProps = {
  channel: SalesChannel
  isReactivatePending: boolean
  onDelete: () => void
  onEdit: () => void
  onToggleStatus: () => void
}

export const SalesChannelRowActions = ({
  channel,
  isReactivatePending,
  onDelete,
  onEdit,
  onToggleStatus,
}: SalesChannelRowActionsProps) => {
  const isActive = channel.status === 'active'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Abrir ações de ${channel.name}`}
        className='grid size-11 shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
      >
        <Icon name='ellipsis' className='size-[18px]' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-[232px] max-w-[calc(100vw-1.5rem)] rounded-2xl p-2 shadow-dialog'
        sideOffset={8}
      >
        <DropdownMenuItem
          className='min-h-10 gap-3 rounded-xl px-3 py-2 text-sm font-bold'
          onClick={onEdit}
        >
          <Icon name='pencil' className='size-5 text-muted-foreground' />
          Editar canal
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='min-h-10 gap-3 rounded-xl px-3 py-2 text-sm font-bold'
          disabled={isReactivatePending}
          onClick={onToggleStatus}
        >
          <Icon
            name={isActive ? 'link-off' : 'circle-check'}
            className={`size-5 ${isActive ? 'text-destructive' : 'text-success'}`}
          />
          {isActive ? 'Inativar canal' : 'Reativar canal'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='min-h-10 gap-3 rounded-xl px-3 py-2 text-sm font-bold'
          onClick={onDelete}
          variant='destructive'
        >
          <Icon name='trash-2' className='size-5' />
          Excluir canal
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
