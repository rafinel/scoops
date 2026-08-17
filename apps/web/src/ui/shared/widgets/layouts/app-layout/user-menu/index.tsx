import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Avatar } from '@/ui/shared/widgets/components/avatar'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'

export type UserMenuProps = {
  account: Account
  error: Error | null
  isPending: boolean
  onLogout: () => Promise<void>
}

export const UserMenu = ({ account, error, isPending, onLogout }: UserMenuProps) => {
  const profileLabel = account.profile === UserProfile.Manager ? 'Gerente' : 'Operador'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${account.name} — ${profileLabel}`}
        className='flex min-h-12 max-w-[calc(100vw-114px)] shrink-0 items-center gap-2.5 rounded-xl border bg-card px-3 py-2 text-left text-sm font-bold focus-visible:outline-2 focus-visible:outline-primary sm:w-[198px] sm:gap-3 sm:px-3.5'
      >
        <Avatar name={account.name} className='size-8 bg-success-soft text-success' />
        <span className='min-w-0 flex-1 truncate'>
          <span>{account.name}</span>
          <span aria-hidden='true' className='hidden sm:inline'>
            {' — '}
          </span>
          <span className='hidden sm:inline'>{profileLabel}</span>
        </span>
        <Icon name='chevron-down' className='size-4 shrink-0 text-muted-foreground' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-64 rounded-xl p-3 text-popover-foreground shadow-dialog'
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className='break-words px-0 text-xs text-muted-foreground'>
            {account.email}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuItem
          className='mt-3 min-h-10 w-full rounded-lg border px-3 text-left text-sm font-bold'
          render={<Anchor route='account' />}
        >
          <Icon name='user-round' className='size-4' />
          Minha conta
        </DropdownMenuItem>
        {error ? (
          <p className='mt-3 text-xs text-destructive' role='alert'>
            Não foi possível sair agora. Tente novamente.
          </p>
        ) : null}
        <DropdownMenuItem
          className='mt-3 min-h-10 w-full rounded-lg border px-3 text-left text-sm font-bold'
          disabled={isPending}
          onClick={() => void onLogout()}
        >
          {isPending ? 'Saindo…' : 'Sair deste dispositivo'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
