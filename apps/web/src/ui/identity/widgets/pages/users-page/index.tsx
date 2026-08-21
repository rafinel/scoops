import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'

import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/ui/shared/widgets/components/avatar'
import { Button } from '@/ui/shadcn/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ActionDialog } from '../user-details-page/action-dialog'
import {
  dateLabel,
  profileIcon,
  profileLabel,
  statusFilterLabel,
  statusLabel,
} from './formatters'
import { UserCard } from './user-card'
import { UserActionsMenu } from './user-actions-menu'
import { UserInviteDialog } from './user-invite-dialog'
import { useUsersPage } from './use-users-page'

function useIsMobileUsersLayout() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      (typeof window.matchMedia !== 'function' ||
        window.matchMedia('(max-width: 767px)').matches),
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return isMobile
}

export const UsersPage = () => {
  const isMobileLayout = useIsMobileUsersLayout()
  const {
    actionDialogMessage,
    actionDialogTitle,
    actionError,
    actionPending,
    actionState,
    getUserActionItems,
    handleCloseAction,
    handleConfirmAction,
    handleOpenAction,
    handleOpenUser,
    inviteError,
    inviteUser,
    isError,
    isInviting,
    isInviteOpen,
    isLoading,
    page,
    pagination,
    profile,
    refetch,
    search,
    setInviteOpen,
    setPage,
    setProfile,
    setSearch,
    setStatus,
    status,
    summary,
    users,
  } = useUsersPage()

  return (
    <section className='min-w-0 space-y-5'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='mt-2 text-[28px] font-extrabold tracking-tight'>
            Usuários{' '}
            <span className='text-lg font-semibold text-muted-foreground'>
              ({summary?.total ?? 0})
            </span>
          </h1>
          <p className='mt-1 text-sm font-medium text-muted-foreground'>
            Cadastre pessoas e gerencie quem pode operar ou administrar a sorveteria.
          </p>
        </div>
        <Button
          className='min-h-11 rounded-[10px] px-4 text-sm font-extrabold shadow-primary hover:brightness-105'
          onClick={() => setInviteOpen(true)}
          type='button'
        >
          <Icon name='user-plus' className='size-[18px]' />
          Convidar usuário
        </Button>
      </header>

      <section className='overflow-hidden rounded-2xl border bg-card shadow-card'>
        <div className='flex flex-col gap-4 border-b border-border-soft px-5 py-[18px]'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <p className='text-[15px] font-extrabold'>{summary?.total ?? 0} usuários</p>
              <p className='text-xs font-semibold text-muted-foreground'>
                {summary?.managers ?? 0} gerentes · {summary?.operators ?? 0} operadores
              </p>
            </div>
            <Label className='flex h-10 w-full max-w-[300px] items-center gap-2.5 rounded-[10px] border bg-card px-[13px] focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20'>
              <Icon name='search' className='size-4 shrink-0 text-text-tertiary' />
              <Input
                aria-label='Buscar usuários'
                className='h-auto min-w-0 flex-1 border-0 bg-transparent px-0 text-[13px] font-medium shadow-none placeholder:text-text-tertiary focus:!border-0 focus:!outline-none focus:!ring-0 focus-visible:!border-0 focus-visible:!outline-none focus-visible:!ring-0'
                placeholder='Buscar por nome ou e-mail'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </Label>
          </div>

          <fieldset className='flex flex-wrap items-center gap-2'>
            <legend className='sr-only'>Filtrar perfil</legend>
            <Button
              variant='ghost'
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                !profile ? 'bg-accent text-primary' : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setProfile(undefined)}
              type='button'
            >
              Todos
              <span className='text-[11px] font-black'>{summary?.total ?? 0}</span>
            </Button>
            <Button
              variant='ghost'
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                profile === UserProfile.Manager
                  ? 'bg-accent text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setProfile(UserProfile.Manager)}
              type='button'
            >
              Gerentes
              <span className='text-[11px] font-extrabold'>{summary?.managers ?? 0}</span>
            </Button>
            <Button
              variant='ghost'
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                profile === UserProfile.Operator
                  ? 'bg-accent text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setProfile(UserProfile.Operator)}
              type='button'
            >
              Operadores
              <span className='text-[11px] font-extrabold'>
                {summary?.operators ?? 0}
              </span>
            </Button>
            <Label className='sr-only' htmlFor='users-status-filter'>
              Filtrar status
            </Label>
            <Select
              value={status ?? null}
              onValueChange={(value) =>
                setStatus((value || undefined) as UserStatus | undefined)
              }
            >
              <SelectTrigger
                aria-label='Filtrar status'
                className='ml-auto h-8 rounded-lg bg-card px-2.5 text-xs font-bold text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20'
                id='users-status-filter'
              >
                <SelectValue placeholder='Todos os status'>
                  {status ? statusFilterLabel(status) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserStatus.Active}>Ativos</SelectItem>
                <SelectItem value={UserStatus.Pending}>Pendentes</SelectItem>
                <SelectItem value={UserStatus.Inactive}>Inativos</SelectItem>
              </SelectContent>
            </Select>
          </fieldset>
        </div>

        {isLoading ? (
          <div
            aria-live='polite'
            className='py-16 text-center text-sm text-muted-foreground'
          >
            Carregando usuários…
          </div>
        ) : isError ? (
          <div className='py-16 text-center'>
            <p className='font-bold'>Não foi possível carregar os usuários.</p>
            <Button
              variant='outline'
              className='mt-3 rounded-lg px-4 py-2 text-sm font-bold'
              onClick={() => void refetch()}
              type='button'
            >
              Tentar novamente
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className='py-16 text-center'>
            <p className='font-bold'>Nenhum usuário encontrado.</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Ajuste os filtros ou convide alguém para começar.
            </p>
          </div>
        ) : isMobileLayout ? (
          <div className='grid min-w-0 gap-3 p-3'>
            {users.map((user) => (
              <UserCard
                items={getUserActionItems(user)}
                key={user.id}
                onEdit={handleOpenUser}
                onSelectAction={handleOpenAction}
                user={user}
              />
            ))}
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <div className='min-w-[720px]'>
              <div className='grid h-11 grid-cols-[minmax(280px,1.8fr)_180px_210px_170px_minmax(100px,1fr)] items-center gap-4 bg-muted px-5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-tertiary'>
                <span>Usuário</span>
                <span>Perfil</span>
                <span>Status</span>
                <span>Último acesso</span>
                <span className='text-right'>Ações</span>
              </div>
              {users.map((user) => {
                const items = getUserActionItems(user)

                return (
                  <div
                    className='grid min-h-[74px] grid-cols-[minmax(280px,1.8fr)_180px_210px_170px_minmax(100px,1fr)] items-center gap-4 border-t border-border-soft px-5 transition-colors hover:bg-muted'
                    key={user.id}
                  >
                    <Link
                      className='flex min-w-0 items-center gap-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40'
                      params={{ userId: user.id }}
                      to={ROUTES.userDetails}
                    >
                      <Avatar name={user.name} />
                      <span className='min-w-0'>
                        <strong className='block truncate text-[13px] font-extrabold'>
                          {user.name}
                        </strong>
                        <span className='block truncate text-[11px] font-medium text-muted-foreground'>
                          {user.email}
                        </span>
                      </span>
                    </Link>
                    <Link
                      className='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40'
                      params={{ userId: user.id }}
                      to={ROUTES.userDetails}
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold ${
                          user.profile === UserProfile.Manager
                            ? 'bg-accent text-primary'
                            : 'bg-info-soft text-info'
                        }`}
                      >
                        <Icon name={profileIcon(user.profile)} className='size-3' />
                        {profileLabel(user.profile)}
                      </span>
                    </Link>
                    <Link
                      className='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40'
                      params={{ userId: user.id }}
                      to={ROUTES.userDetails}
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold ${
                          user.status === UserStatus.Active
                            ? 'bg-success-soft text-success'
                            : user.status === UserStatus.Pending
                              ? 'bg-warning-soft text-warning'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <span className='size-1.5 rounded-full bg-current' />
                        {statusLabel(user.status)}
                      </span>
                    </Link>
                    <Link
                      className='text-xs font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40'
                      params={{ userId: user.id }}
                      to={ROUTES.userDetails}
                    >
                      {dateLabel(user.lastAccessAt)}
                    </Link>
                    <span className='flex justify-end'>
                      <UserActionsMenu
                        items={items}
                        onEdit={() => handleOpenUser(user.id)}
                        onSelectAction={(action) => handleOpenAction(user, action)}
                        userName={user.name}
                      />
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <footer className='flex flex-col gap-3 border-t border-border-soft bg-muted px-5 py-3.5 text-xs font-semibold text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
          <span>
            Mostrando {users.length} de {pagination?.total ?? 0} usuários
          </span>
          <span className='flex items-center gap-2'>
            <Icon name='shield-alert' className='size-[14px]' />
            Seu próprio perfil não pode ser alterado.
          </span>
          {pagination && pagination.totalPages > 1 ? (
            <span className='flex gap-2'>
              <Button
                variant='outline'
                className='rounded-lg bg-card px-3 py-1.5 font-bold disabled:opacity-40'
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                type='button'
              >
                Anterior
              </Button>
              <Button
                variant='outline'
                className='rounded-lg bg-card px-3 py-1.5 font-bold disabled:opacity-40'
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
                type='button'
              >
                Próxima
              </Button>
            </span>
          ) : null}
        </footer>
      </section>

      <UserInviteDialog
        error={inviteError instanceof Error ? inviteError : null}
        isPending={isInviting}
        onClose={() => setInviteOpen(false)}
        onSubmit={inviteUser}
        open={isInviteOpen}
      />
      {actionState ? (
        <ActionDialog
          danger={actionState.action === 'deactivate' || actionState.action === 'cancel'}
          error={actionError}
          onClose={handleCloseAction}
          onConfirm={handleConfirmAction}
          open={Boolean(actionState)}
          pending={actionPending}
          title={actionDialogTitle}
          message={actionDialogMessage}
          confirmLabel={actionState.action === 'resend' ? 'Reenviar' : 'Confirmar'}
        />
      ) : null}
    </section>
  )
}
