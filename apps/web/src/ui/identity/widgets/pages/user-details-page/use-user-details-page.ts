import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'

import { ROUTES } from '@/constants/routes'
import { useCancelUserInvitationAction } from '@/ui/identity/hooks/use-cancel-user-invitation-action'
import { useChangeUserProfileAction } from '@/ui/identity/hooks/use-change-user-profile-action'
import { useChangeUserStatusAction } from '@/ui/identity/hooks/use-change-user-status-action'
import { useCorrectUserInvitationAction } from '@/ui/identity/hooks/use-correct-user-invitation-action'
import { useCorrectUserNameAction } from '@/ui/identity/hooks/use-correct-user-name-action'
import { useResendUserInvitationAction } from '@/ui/identity/hooks/use-resend-user-invitation-action'
import { useUserDetailsQuery } from '@/ui/identity/hooks/use-user-details-query'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import {
  invitationExpiresAt,
  invitationRemainingDays,
  invitationSentAt,
} from './formatters'

const HISTORY_PAGE_SIZE = 5

export type UserDetailsDialog =
  | 'deactivate'
  | 'reactivate'
  | 'promote'
  | 'demote'
  | 'cancel'
  | 'resend'
  | 'name'
  | 'correctInvitation'
  | null

export type UserDetailsPageProps = {
  userId: string
}

export type CorrectInvitationInput = {
  name: string
  email: string
}

export function useUserDetailsPage({ userId }: UserDetailsPageProps) {
  const query = useUserDetailsQuery(userId)
  const { account } = useAuthContext()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<UserDetailsDialog>(null)
  const status = useChangeUserStatusAction()
  const profile = useChangeUserProfileAction()
  const name = useCorrectUserNameAction()
  const cancel = useCancelUserInvitationAction()
  const resend = useResendUserInvitationAction()
  const correct = useCorrectUserInvitationAction()
  const user = query.userDetails?.user
  const allAuditRecords = query.userDetails?.auditRecords ?? []
  const [historyPage, setHistoryPage] = useState(1)
  const historyRecords = [...allAuditRecords].sort(
    (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
  )
  const historyTotalPages = Math.max(
    1,
    Math.ceil(historyRecords.length / HISTORY_PAGE_SIZE),
  )
  const visibleHistoryRecords = historyRecords.slice(
    (historyPage - 1) * HISTORY_PAGE_SIZE,
    historyPage * HISTORY_PAGE_SIZE,
  )
  const sentAt = user ? invitationSentAt(allAuditRecords, user.createdAt) : undefined
  const expiresAt = sentAt ? invitationExpiresAt(allAuditRecords, sentAt) : undefined
  const isSelf = account?.id === user?.id
  const pending =
    status.isPending ||
    profile.isPending ||
    name.isPending ||
    cancel.isPending ||
    resend.isPending ||
    correct.isPending
  const error = (status.error ??
    profile.error ??
    name.error ??
    cancel.error ??
    resend.error ??
    correct.error) as Error | null

  useEffect(() => {
    if (userId) setHistoryPage(1)
  }, [userId])

  useEffect(() => {
    setHistoryPage((currentPage) => Math.min(currentPage, historyTotalPages))
  }, [historyTotalPages])

  function handleOpenDialog(nextDialog: Exclude<UserDetailsDialog, null>) {
    setDialog(nextDialog)
  }

  function handleCloseDialog() {
    setDialog(null)
  }

  function setHistoryPageWithinBounds(nextPage: number) {
    setHistoryPage(Math.min(Math.max(1, nextPage), historyTotalPages))
  }

  async function handleBack() {
    await navigate({
      to: ROUTES.users,
      search: { search: '', profile: undefined, status: undefined, page: 1 },
    })
  }

  async function handleConfirmAction() {
    if (dialog === 'deactivate' || dialog === 'reactivate') {
      await status.changeUserStatus({
        userId,
        status: dialog === 'deactivate' ? UserStatus.Inactive : UserStatus.Active,
      })
    }
    if (dialog === 'promote' || dialog === 'demote') {
      await profile.changeUserProfile({
        userId,
        profile: dialog === 'promote' ? UserProfile.Manager : UserProfile.Operator,
      })
    }
    if (dialog === 'cancel') {
      await cancel.cancelUserInvitation(userId)
      await handleBack()
      return
    }
    if (dialog === 'resend') {
      await resend.resendUserInvitation(userId)
    }
    setDialog(null)
  }

  async function handleCorrectName(nextName: string) {
    await name.correctUserName({ userId, name: nextName })
    setDialog(null)
  }

  async function handleCorrectInvitation(input: CorrectInvitationInput) {
    if (!user) return
    await correct.correctUserInvitation({
      userId,
      ...input,
      profile: user.profile,
    })
    setDialog(null)
  }

  return {
    correctError: correct.error as Error | null,
    correctPending: correct.isPending,
    dialog,
    error,
    historyPage,
    historyPageSize: HISTORY_PAGE_SIZE,
    historyRecords: visibleHistoryRecords,
    historyTotal: historyRecords.length,
    historyTotalPages,
    invitationExpiresAt: expiresAt,
    invitationRemainingDays: expiresAt ? invitationRemainingDays(expiresAt) : undefined,
    invitationSentAt: sentAt,
    handleBack,
    handleCloseDialog,
    handleConfirmAction,
    handleCorrectInvitation,
    handleCorrectName,
    handleOpenDialog,
    setHistoryPage: setHistoryPageWithinBounds,
    isError: query.isError || (!query.isLoading && !query.userDetails),
    isLoading: query.isLoading,
    isSelf,
    nameError: name.error as Error | null,
    namePending: name.isPending,
    pending,
    refetch: query.refetch,
    userDetails: query.userDetails,
    user,
  }
}
