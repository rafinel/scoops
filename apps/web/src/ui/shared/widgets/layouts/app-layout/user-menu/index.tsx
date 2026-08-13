import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'

export type UserMenuProps = {
  account: Account
  error: Error | null
  isPending: boolean
  onLogout: () => Promise<void>
}

export const UserMenu = ({ account, error, isPending, onLogout }: UserMenuProps) => {
  const profileLabel = account.profile === UserProfile.Manager ? 'Manager' : 'Operator'

  return (
    <details className='relative'>
      <summary className='min-h-11 cursor-pointer list-none rounded-lg border bg-card px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-primary'>
        <span className='block max-w-44 truncate font-bold'>{account.name}</span>
        <span className='block text-xs text-muted-foreground'>{profileLabel}</span>
      </summary>
      <div className='absolute right-0 z-10 mt-2 w-64 rounded-xl border bg-popover p-3 text-popover-foreground shadow-dialog'>
        <p className='break-words text-xs text-muted-foreground'>{account.email}</p>
        {error ? (
          <p className='mt-3 text-xs text-destructive' role='alert'>
            Não foi possível sair agora. Tente novamente.
          </p>
        ) : null}
        <button
          className='mt-3 min-h-10 w-full rounded-lg border px-3 text-left text-sm font-bold disabled:opacity-60'
          disabled={isPending}
          onClick={() => void onLogout()}
          type='button'
        >
          {isPending ? 'Saindo…' : 'Sair deste dispositivo'}
        </button>
      </div>
    </details>
  )
}
