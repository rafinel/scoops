import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'

export function statusLabel(status: UserStatus) {
  return status === UserStatus.Active
    ? 'Ativo'
    : status === UserStatus.Pending
      ? 'Convite pendente'
      : 'Inativo'
}

export function statusFilterLabel(status: UserStatus) {
  return status === UserStatus.Active
    ? 'Ativos'
    : status === UserStatus.Pending
      ? 'Pendentes'
      : 'Inativos'
}

export function profileLabel(profile: UserProfile) {
  return profile === UserProfile.Manager ? 'Gerente' : 'Operador'
}

export function dateLabel(date?: Date) {
  return date
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)
    : 'Nunca'
}

export function profileIcon(profile: UserProfile) {
  return profile === UserProfile.Manager ? 'shield' : 'user-round'
}
