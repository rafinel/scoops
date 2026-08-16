import { useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'

import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'
import type { UserSummary } from '@scoops/core/identity/domain/structures'

import { ROUTES } from '@/constants/routes'
import { useCancelUserInvitationAction } from '@/ui/identity/hooks/use-cancel-user-invitation-action'
import { useChangeUserProfileAction } from '@/ui/identity/hooks/use-change-user-profile-action'
import { useChangeUserStatusAction } from '@/ui/identity/hooks/use-change-user-status-action'
import { useInviteUserAction } from '@/ui/identity/hooks/use-invite-user-action'
import { useResendUserInvitationAction } from '@/ui/identity/hooks/use-resend-user-invitation-action'
import { useUsersQuery } from '@/ui/identity/hooks/use-users-query'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

export type UserAction =
  | 'promote'
  | 'demote'
  | 'deactivate'
  | 'reactivate'
  | 'resend'
  | 'cancel'

export type UserActionState = {
  action: UserAction
  user: UserSummary
}

export type UserActionItem = {
  action: UserAction
  label: string
  icon: 'send' | 'x' | 'shield' | 'user-round' | 'user-check'
  iconClassName: string
  destructive?: boolean
  hidden?: boolean
  disabled: boolean
}

export function useUsersPage() {
  const searchParams = useSearch({ strict: false }) as Partial<{
    search: string
    status: UserStatus
    profile: UserProfile
    page: number
  }>
  const search = searchParams.search ?? ''
  const status = searchParams.status
  const profile = searchParams.profile
  const page = searchParams.page ?? 1
  // Use the public URL path as the navigation base. The route's internal ID
  // includes the `_authenticated` layout segment, but that segment must not
  // leak into browser URLs when search parameters change.
  const navigate = useNavigate({ from: '/users/' as never })
  const { account } = useAuthContext()
  const [isInviteOpen, setInviteOpen] = useState(false)
  const [actionState, setActionState] = useState<UserActionState | null>(null)
  const usersQuery = useUsersQuery({ search, status, profile, page, pageSize: 10 })
  const invite = useInviteUserAction()
  const profileAction = useChangeUserProfileAction()
  const statusAction = useChangeUserStatusAction()
  const resendAction = useResendUserInvitationAction()
  const cancelAction = useCancelUserInvitationAction()

  function updateSearch(next: {
    search?: string
    status?: UserStatus
    profile?: UserProfile
    page?: number
  }) {
    void navigate({
      search: (previous: never) => ({
        ...(previous as unknown as typeof searchParams),
        ...next,
      }),
    } as never)
  }

  async function inviteUser(input: {
    name: string
    email: string
    profile: UserProfile
  }) {
    await invite.inviteUser(input)
    setInviteOpen(false)
  }

  function getUserActionItems(user: UserSummary): UserActionItem[] {
    const isSelf = account?.id === user.id

    if (user.status === UserStatus.Pending) {
      return [
        {
          action: 'resend',
          label: 'Reenviar convite',
          icon: 'send',
          iconClassName: 'text-primary',
          disabled: false,
        },
        {
          action: 'cancel',
          label: 'Cancelar convite',
          icon: 'x',
          iconClassName: 'text-danger',
          destructive: true,
          disabled: false,
        },
      ]
    }

    const items: UserActionItem[] = [
      {
        action: 'promote',
        label: 'Promover a gerente',
        icon: 'shield',
        iconClassName: 'text-primary',
        hidden:
          user.profile === UserProfile.Manager || user.status === UserStatus.Inactive,
        disabled: isSelf,
      },
      {
        action: 'demote',
        label: 'Rebaixar a operador',
        icon: 'user-round',
        iconClassName: 'text-warning',
        hidden:
          user.profile === UserProfile.Operator || user.status === UserStatus.Inactive,
        disabled: isSelf,
      },
      {
        action: user.status === UserStatus.Inactive ? 'reactivate' : 'deactivate',
        label:
          user.status === UserStatus.Inactive ? 'Reativar acesso' : 'Desativar acesso',
        icon: user.status === UserStatus.Inactive ? 'user-check' : 'user-round',
        iconClassName:
          user.status === UserStatus.Inactive ? 'text-success' : 'text-danger',
        destructive: user.status !== UserStatus.Inactive,
        disabled: isSelf,
      },
    ]
    return items.filter((item) => !item.hidden)
  }

  function handleOpenAction(user: UserSummary, action: UserAction) {
    setActionState({ action, user })
  }

  function handleCloseAction() {
    setActionState(null)
  }

  async function handleConfirmAction() {
    if (!actionState) return

    if (actionState.action === 'promote' || actionState.action === 'demote') {
      await profileAction.changeUserProfile({
        userId: actionState.user.id,
        profile:
          actionState.action === 'promote' ? UserProfile.Manager : UserProfile.Operator,
      })
    }
    if (actionState.action === 'deactivate' || actionState.action === 'reactivate') {
      await statusAction.changeUserStatus({
        userId: actionState.user.id,
        status:
          actionState.action === 'deactivate' ? UserStatus.Inactive : UserStatus.Active,
      })
    }
    if (actionState.action === 'resend') {
      await resendAction.resendUserInvitation(actionState.user.id)
    }
    if (actionState.action === 'cancel') {
      await cancelAction.cancelUserInvitation(actionState.user.id)
    }
    setActionState(null)
  }

  function handleOpenUser(userId: string) {
    void navigate({ to: ROUTES.userDetails, params: { userId } } as never)
  }

  function getActionDialogTitle() {
    if (!actionState) return ''

    const titles: Record<UserAction, string> = {
      promote: 'Promover usuário?',
      demote: 'Rebaixar usuário?',
      deactivate: 'Desativar acesso?',
      reactivate: 'Reativar acesso?',
      resend: 'Reenviar convite?',
      cancel: 'Cancelar convite?',
    }
    return titles[actionState.action]
  }

  function getActionDialogMessage() {
    if (!actionState) return ''

    const messages: Record<UserAction, string> = {
      promote: `${actionState.user.name} terá acesso às configurações e à gestão de usuários.`,
      demote: `${actionState.user.name} deixará de ter acesso às configurações e à gestão de usuários.`,
      deactivate: `O acesso de ${actionState.user.name} será bloqueado.`,
      reactivate: `O acesso de ${actionState.user.name} será restaurado.`,
      resend: `Um novo convite será enviado para ${actionState.user.email}.`,
      cancel: `O convite pendente de ${actionState.user.name} será cancelado.`,
    }
    return messages[actionState.action]
  }

  const actionPending =
    profileAction.isPending ||
    statusAction.isPending ||
    resendAction.isPending ||
    cancelAction.isPending
  const actionError = (profileAction.error ??
    statusAction.error ??
    resendAction.error ??
    cancelAction.error) as Error | null

  function setSearch(value: string) {
    updateSearch({ search: value, page: 1 })
  }

  function setStatus(value: UserStatus | undefined) {
    updateSearch({ status: value, page: 1 })
  }

  function setProfile(value: UserProfile | undefined) {
    updateSearch({ profile: value, page: 1 })
  }

  function setPage(value: number) {
    updateSearch({ page: Math.max(1, value) })
  }

  return {
    ...usersQuery,
    search,
    setSearch,
    status,
    setStatus,
    profile,
    setProfile,
    page,
    setPage,
    isInviteOpen,
    setInviteOpen,
    inviteUser,
    inviteError: invite.error,
    isInviting: invite.isPending,
    actionError,
    actionPending,
    actionState,
    actionDialogMessage: getActionDialogMessage(),
    actionDialogTitle: getActionDialogTitle(),
    getUserActionItems,
    handleCloseAction,
    handleConfirmAction,
    handleOpenAction,
    handleOpenUser,
  }
}
