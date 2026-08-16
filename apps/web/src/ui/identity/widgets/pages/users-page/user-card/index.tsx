import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import type { UserSummary } from '@scoops/core/identity/domain/structures'
import { Link } from '@tanstack/react-router'

import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/ui/shared/widgets/components/avatar'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { dateLabel, profileIcon, profileLabel, statusLabel } from '../formatters'
import type { UserAction, UserActionItem } from '../use-users-page'
import { UserActionsMenu } from '../user-actions-menu'

export type UserCardProps = {
  user: UserSummary
  items: UserActionItem[]
  onEdit: (userId: string) => void
  onSelectAction: (user: UserSummary, action: UserAction) => void
}

export const UserCard = ({ user, items, onEdit, onSelectAction }: UserCardProps) => {
  return (
    <article
      aria-label={`Usuário ${user.name}`}
      className='min-w-0 overflow-hidden rounded-xl border border-border-soft bg-card p-4 shadow-card'
    >
      <div className='flex min-w-0 items-start justify-between gap-3'>
        <Link
          className='flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
          params={{ userId: user.id }}
          to={ROUTES.userDetails}
        >
          <Avatar name={user.name} />
          <span className='min-w-0'>
            <strong className='block truncate text-sm font-extrabold'>{user.name}</strong>
            <span className='block truncate text-xs font-medium text-muted-foreground'>
              {user.email}
            </span>
          </span>
        </Link>
        <UserActionsMenu
          items={items}
          onEdit={() => onEdit(user.id)}
          onSelectAction={(action) => onSelectAction(user, action)}
          userName={user.name}
        />
      </div>

      <dl className='mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 border-t border-border-soft pt-3 text-sm'>
        <div className='min-w-0'>
          <dt className='text-xs font-semibold text-muted-foreground'>Perfil</dt>
          <dd className='mt-1 min-w-0'>
            <span
              className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold ${
                user.profile === UserProfile.Manager
                  ? 'bg-accent text-primary'
                  : 'bg-info-soft text-info'
              }`}
            >
              <Icon name={profileIcon(user.profile)} className='size-3 shrink-0' />
              <span className='truncate'>{profileLabel(user.profile)}</span>
            </span>
          </dd>
        </div>
        <div className='min-w-0'>
          <dt className='text-xs font-semibold text-muted-foreground'>Status</dt>
          <dd className='mt-1 min-w-0'>
            <span
              className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold ${
                user.status === UserStatus.Active
                  ? 'bg-success-soft text-success'
                  : user.status === UserStatus.Pending
                    ? 'bg-warning-soft text-warning'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className='size-1.5 shrink-0 rounded-full bg-current' />
              <span className='truncate'>{statusLabel(user.status)}</span>
            </span>
          </dd>
        </div>
        <div className='col-span-2 min-w-0'>
          <dt className='text-xs font-semibold text-muted-foreground'>Último acesso</dt>
          <dd className='mt-1 truncate text-xs font-semibold text-muted-foreground'>
            {dateLabel(user.lastAccessAt)}
          </dd>
        </div>
      </dl>
    </article>
  )
}
