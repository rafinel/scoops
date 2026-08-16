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
  actionLabel,
  invitationExpiresAt,
  invitationRemainingDays,
  profileDescription,
} from '../formatters'

const auditRecord = (overrides: Partial<UserAuditRecord> = {}): UserAuditRecord => ({
  id: 'audit-id',
  establishmentId: 'establishment-id',
  affectedUserId: 'user-id',
  affectedUserName: 'Marina Alves',
  actorType: UserAuditActorType.User,
  actorName: 'Carlo Mendes',
  action: UserAuditAction.UserRegistered,
  occurredAt: new Date('2026-08-15T10:00:00.000Z'),
  ...overrides,
})

describe('user details formatters', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('maps a pending operator to the invitation state shown in the design', () => {
    expect(profileDescription(UserProfile.Operator, UserStatus.Pending)).toBe(
      'O acesso será liberado após aceitar o convite.',
    )
    expect(
      actionDescription(
        auditRecord({
          action: UserAuditAction.UserRegistered,
          newValue: UserProfile.Operator,
          affectedUserName: 'Ana Souza',
        }),
      ),
    ).toBe('Perfil inicial definido como Operador.')
  })

  it('maps an active manager to the management state shown in the design', () => {
    expect(profileDescription(UserProfile.Manager, UserStatus.Active)).toBe(
      'Acesso integral à operação e à gestão da sorveteria.',
    )
    expect(
      actionLabel(
        auditRecord({
          action: UserAuditAction.ProfileChanged,
          newValue: UserProfile.Manager,
        }),
      ),
    ).toBe('Promovida a gerente')
    expect(
      actionDescription(
        auditRecord({
          action: UserAuditAction.ProfileChanged,
          newValue: UserProfile.Manager,
        }),
      ),
    ).toBe('Acesso ao gerenciamento de usuários e configurações liberado.')
  })

  it('derives seven days from a newly sent invitation when no expiry is stored', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-15T12:00:00.000Z'))
    const sentAt = new Date('2026-08-15T10:00:00.000Z')
    const expiresAt = invitationExpiresAt([], sentAt)

    expect(expiresAt).toEqual(new Date('2026-08-22T10:00:00.000Z'))
    expect(invitationRemainingDays(expiresAt)).toBe(7)
  })
})
