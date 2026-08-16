import {
  UserAuditAction,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import type { UserAuditRecord } from '@scoops/core/identity/domain/entities'

import type { IconName } from '@/ui/shared/widgets/components/icon'

const INVITATION_VALIDITY_DAYS = 7
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000

export function statusLabel(status: UserStatus) {
  return status === UserStatus.Active
    ? 'Ativo'
    : status === UserStatus.Pending
      ? 'Convite pendente'
      : 'Inativo'
}

export function profileLabel(profile: UserProfile) {
  return profile === UserProfile.Manager ? 'Gerente' : 'Operador'
}

function profileLabelFromValue(profile?: string) {
  return profile === UserProfile.Manager
    ? 'Gerente'
    : profile === UserProfile.Operator
      ? 'Operador'
      : 'perfil'
}

export function profileDescription(profile: UserProfile, status: UserStatus) {
  if (status === UserStatus.Pending) {
    return 'O acesso será liberado após aceitar o convite.'
  }
  if (status === UserStatus.Inactive) {
    return 'O acesso desta conta está bloqueado.'
  }
  return profile === UserProfile.Manager
    ? 'Acesso integral à operação e à gestão da sorveteria.'
    : 'Acesso focado na operação diária da sorveteria.'
}

export function invitationSentAt(records: readonly UserAuditRecord[], fallback: Date) {
  const invitationRecord = records
    .filter(
      (record) =>
        record.action === UserAuditAction.InvitationResent ||
        record.action === UserAuditAction.UserRegistered,
    )
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0]
  return invitationRecord?.occurredAt ?? fallback
}

export function invitationExpiresAt(records: readonly UserAuditRecord[], sentAt: Date) {
  const resentRecord = [...records]
    .filter((record) => record.action === UserAuditAction.InvitationResent)
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0]
  const recordedExpiry = resentRecord?.newValue
    ? new Date(resentRecord.newValue)
    : undefined
  return recordedExpiry && Number.isFinite(recordedExpiry.getTime())
    ? recordedExpiry
    : new Date(sentAt.getTime() + INVITATION_VALIDITY_DAYS * DAY_IN_MILLISECONDS)
}

export function invitationRemainingDays(expiresAt: Date) {
  return Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / DAY_IN_MILLISECONDS))
}

export function invitationSentLabel(date: Date) {
  const now = new Date()
  const isToday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  if (isToday) return `Hoje, ${time}`
  const day = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replace(/\./g, '')
  return `${day}, ${time}`
}

export function actionLabel(record: Pick<UserAuditRecord, 'action' | 'newValue'>) {
  const labels: Record<UserAuditAction, string> = {
    [UserAuditAction.UserRegistered]: 'Usuário cadastrado',
    [UserAuditAction.InvitationResent]: 'Convite reenviado',
    [UserAuditAction.InvitationCancelled]: 'Convite cancelado',
    [UserAuditAction.UserActivated]: 'Usuária ativada',
    [UserAuditAction.ProfileChanged]:
      record.newValue === UserProfile.Manager
        ? 'Promovida a gerente'
        : 'Rebaixada a operadora',
    [UserAuditAction.UserInactivated]: 'Acesso desativado',
    [UserAuditAction.UserReactivated]: 'Acesso reativado',
    [UserAuditAction.UserNameChanged]: 'Nome corrigido',
  }
  return labels[record.action] ?? record.action
}

type ActionDescriptionRecord = Pick<
  UserAuditRecord,
  'action' | 'newValue' | 'previousValue' | 'affectedUserName'
>

export function actionDescription(record: ActionDescriptionRecord) {
  switch (record.action) {
    case UserAuditAction.UserRegistered:
      return `Perfil inicial definido como ${profileLabelFromValue(record.newValue)}.`
    case UserAuditAction.InvitationResent:
      return 'Um novo link de convite foi enviado.'
    case UserAuditAction.InvitationCancelled:
      return 'O convite pendente foi cancelado.'
    case UserAuditAction.UserActivated:
      return `${record.affectedUserName} aceitou o convite e confirmou a conta.`
    case UserAuditAction.ProfileChanged:
      return record.newValue === UserProfile.Manager
        ? 'Acesso ao gerenciamento de usuários e configurações liberado.'
        : `Perfil alterado de ${profileLabelFromValue(record.previousValue)} para ${profileLabelFromValue(record.newValue)}.`
    case UserAuditAction.UserInactivated:
      return 'O acesso desta conta foi bloqueado.'
    case UserAuditAction.UserReactivated:
      return 'O acesso desta conta foi restaurado.'
    case UserAuditAction.UserNameChanged:
      return 'O nome exibido da conta foi atualizado.'
  }
}

export function actionIcon(action: UserAuditAction): IconName {
  switch (action) {
    case UserAuditAction.UserActivated:
      return 'circle-check'
    case UserAuditAction.InvitationResent:
      return 'send'
    case UserAuditAction.UserRegistered:
      return 'user-plus'
    case UserAuditAction.InvitationCancelled:
      return 'x'
    case UserAuditAction.ProfileChanged:
      return 'shield'
    case UserAuditAction.UserInactivated:
      return 'lock'
    case UserAuditAction.UserReactivated:
      return 'user-check'
    case UserAuditAction.UserNameChanged:
      return 'pencil'
  }
}

export function dateTimeLabel(date?: Date) {
  return date ? `${compactDateLabel(date)}, ${timeLabel(date)}` : 'Nunca'
}

export function dateLabel(date?: Date) {
  return date ? compactDateLabel(date) : 'Nunca'
}

export function shortDateTimeLabel(date?: Date) {
  if (!date) return 'Nunca'
  const now = new Date()
  const isToday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  return isToday
    ? `Hoje, ${timeLabel(date)}`
    : `${compactDateLabel(date)}, ${timeLabel(date)}`
}

function compactDateLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replace(/ de |\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function timeLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
