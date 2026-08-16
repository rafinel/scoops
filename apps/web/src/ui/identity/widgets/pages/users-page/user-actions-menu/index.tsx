import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { UserAction, UserActionItem } from '../use-users-page'

export type UserActionsMenuProps = {
  userName: string
  items: UserActionItem[]
  onEdit: () => void
  onSelectAction: (action: UserAction) => void
}

export const UserActionsMenu = ({
  userName,
  items,
  onEdit,
  onSelectAction,
}: UserActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Abrir ações de ${userName}`}
        className='grid size-[30px] shrink-0 place-items-center rounded-lg border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
      >
        <Icon name='ellipsis' className='size-[15px]' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl p-2 shadow-dialog'
        sideOffset={8}
      >
        <DropdownMenuItem
          className='min-h-11 gap-3 rounded-xl px-3 py-2 text-sm font-bold'
          onClick={onEdit}
        >
          <Icon name='pencil' className='size-5 text-muted-foreground' />
          Editar usuário
        </DropdownMenuItem>
        {items.map((item, index) => (
          <span key={item.action}>
            {index === items.length - 1 && items.length > 1 ? (
              <DropdownMenuSeparator />
            ) : null}
            <DropdownMenuItem
              className='min-h-11 gap-3 rounded-xl px-3 py-2 text-sm font-bold'
              disabled={item.disabled}
              onClick={() => onSelectAction(item.action)}
              variant={item.destructive ? 'destructive' : 'default'}
            >
              <Icon name={item.icon} className={`size-5 ${item.iconClassName}`} />
              {item.label}
            </DropdownMenuItem>
          </span>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
