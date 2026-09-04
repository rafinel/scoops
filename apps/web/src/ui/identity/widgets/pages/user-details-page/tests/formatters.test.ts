import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  UserAuditAction,
  UserAuditActorType,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import type { UserAuditRecord } from '@scoops/core/identity/domain/entities'

import {
  actionDescription,
  actionIcon,
  actionLabel,
  dateLabel,
  dateTimeLabel,
  invitationExpiresAt,
  invitationRemainingDays,
  invitationSentAt,
  invitationSentLabel,
  profileDescription,
  profileLabel,
  shortDateTimeLabel,
  statusLabel,
} from '../formatters'

const sentAt = new Date('2026-08-15T10:00:00.000Z')

function auditRecord(
  action: UserAuditAction,
  overrides: Partial<UserAuditRecord> = {},
): UserAuditRecord {
  return {
    id: `audit-${action}`,
    establishmentId: 'establishment-id',
    affectedUserId: 'user-id',
    affectedUserName: 'Marina Alves',
    actorType: UserAuditActorType.User,
    actorName: 'Carlo Mendes',
    action,
    occurredAt: sentAt,
    ...overrides,
  }
}

describe('user details formatters', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('maps status, profile and profile descriptions for every account state', () => {
    expect(statusLabel(UserStatus.Active)).toBe('Ativo')
    expect(statusLabel(UserStatus.Pending)).toBe('Convite pendente')
    expect(statusLabel(UserStatus.Inactive)).toBe('Inativo')
    expect(profileLabel(UserProfile.Manager)).toBe('Gerente')
    expect(profileLabel(UserProfile.Operator)).toBe('Operador')
    expect(profileDescription(UserProfile.Operator, UserStatus.Pending)).toBe(
      'O acesso será liberado após aceitar o convite.',
    )
    expect(profileDescription(UserProfile.Operator, UserStatus.Inactive)).toBe(
      'O acesso desta conta está bloqueado.',
    )
    expect(profileDescription(UserProfile.Manager, UserStatus.Active)).toContain('gestão')
    expect(profileDescription(UserProfile.Operator, UserStatus.Active)).toContain(
      'operação diária',
    )
  })

  it('selects the latest invitation record and derives its expiry', () => {
    const older = auditRecord(UserAuditAction.UserRegistered, {
      occurredAt: new Date('2026-08-10T10:00:00.000Z'),
    })
    const latest = auditRecord(UserAuditAction.InvitationResent, {
      occurredAt: new Date('2026-08-16T10:00:00.000Z'),
      newValue: '2026-08-23T10:00:00.000Z',
    })
    expect(invitationSentAt([latest, older], sentAt)).toEqual(latest.occurredAt)
    expect(invitationExpiresAt([latest], sentAt)).toEqual(
      new Date('2026-08-23T10:00:00.000Z'),
    )
    expect(
      invitationExpiresAt([auditRecord(UserAuditAction.InvitationResent)], sentAt),
    ).toEqual(new Date('2026-08-22T10:00:00.000Z'))
    expect(invitationSentAt([], sentAt)).toEqual(sentAt)
  })

  it('maps all audit actions to labels, descriptions and icons', () => {
    const cases = [
      [UserAuditAction.UserRegistered, 'Usuário cadastrado', 'user-plus'],
      [UserAuditAction.InvitationResent, 'Convite reenviado', 'send'],
      [UserAuditAction.InvitationCancelled, 'Convite cancelado', 'x'],
      [UserAuditAction.UserActivated, 'Usuária ativada', 'circle-check'],
      [UserAuditAction.UserInactivated, 'Acesso desativado', 'lock'],
      [UserAuditAction.UserReactivated, 'Acesso reativado', 'user-check'],
      [UserAuditAction.UserNameChanged, 'Nome corrigido', 'pencil'],
      [UserAuditAction.PasswordRecoveryInitiated, 'Recuperação de senha iniciada', 'key'],
    ] as const

    for (const [action, label, icon] of cases) {
      expect(actionLabel(auditRecord(action))).toBe(label)
      expect(actionIcon(action)).toBe(icon)
    }
    expect(
      actionLabel(auditRecord(UserAuditAction.ProfileChanged, { newValue: 'manager' })),
    ).toBe('Promovida a gerente')
    expect(
      actionLabel(auditRecord(UserAuditAction.ProfileChanged, { newValue: 'operator' })),
    ).toBe('Rebaixada a operadora')
    expect(actionIcon(UserAuditAction.ProfileChanged)).toBe('shield')
  })

  it('describes audit outcomes and formats invitation and audit dates', () => {
    expect(
      actionDescription(
        auditRecord(UserAuditAction.UserRegistered, { newValue: UserProfile.Operator }),
      ),
    ).toContain('Operador')
    expect(actionDescription(auditRecord(UserAuditAction.InvitationResent))).toContain(
      'novo link',
    )
    expect(actionDescription(auditRecord(UserAuditAction.InvitationCancelled))).toContain(
      'cancelado',
    )
    expect(actionDescription(auditRecord(UserAuditAction.UserActivated))).toContain(
      'Marina Alves',
    )
    expect(
      actionDescription(
        auditRecord(UserAuditAction.ProfileChanged, {
          previousValue: UserProfile.Operator,
          newValue: UserProfile.Manager,
        }),
      ),
    ).toContain('gerenciamento')
    expect(
      actionDescription(
        auditRecord(UserAuditAction.ProfileChanged, {
          previousValue: UserProfile.Manager,
          newValue: UserProfile.Operator,
        }),
      ),
    ).toContain('Gerente para Operador')
    expect(actionDescription(auditRecord(UserAuditAction.UserInactivated))).toContain(
      'bloqueado',
    )
    expect(actionDescription(auditRecord(UserAuditAction.UserReactivated))).toContain(
      'restaurado',
    )
    expect(actionDescription(auditRecord(UserAuditAction.UserNameChanged))).toContain(
      'atualizado',
    )
    expect(
      actionDescription(auditRecord(UserAuditAction.PasswordRecoveryInitiated)),
    ).toContain('iniciada')

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-15T12:00:00.000Z'))
    expect(invitationRemainingDays(new Date('2026-08-22T10:00:00.000Z'))).toBe(7)
    expect(invitationRemainingDays(new Date('2026-08-14T10:00:00.000Z'))).toBe(0)
    expect(invitationSentLabel(new Date('2026-08-15T10:00:00.000Z'))).toContain('Hoje')
    expect(invitationSentLabel(new Date('2026-08-14T10:00:00.000Z'))).not.toContain(
      'Hoje',
    )
    expect(dateTimeLabel(sentAt)).toContain(',')
    expect(dateTimeLabel()).toBe('Nunca')
    expect(dateLabel(sentAt)).not.toBe('Nunca')
    expect(dateLabel()).toBe('Nunca')
    expect(shortDateTimeLabel(sentAt)).toContain('Hoje')
    expect(shortDateTimeLabel()).toBe('Nunca')
  })
})
