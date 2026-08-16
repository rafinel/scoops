import {
  AccountFaker,
  UserFaker,
  UserAuditRecordFaker,
  UserRegistrationAttemptFaker,
} from '@scoops/core/identity/domain/entities/fakers'
import type {
  Account,
  User,
  UserAuditRecord,
} from '@scoops/core/identity/domain/entities'
import type {
  PendingIceCreamShopOnboarding,
  UserDetails,
} from '@scoops/core/identity/domain/structures'

export function accountResponse(overrides: Partial<Account> = {}) {
  return AccountFaker.fake({
    id: 'browser-manager-id',
    establishmentId: 'browser-establishment-id',
    name: 'Manager Browser',
    email: 'manager@example.com',
    ...overrides,
  })
}

export function userResponse(overrides: Partial<User> = {}) {
  const user = UserFaker.fake({
    id: 'user-operator',
    establishmentId: 'browser-establishment-id',
    name: 'Ana Operator',
    email: 'ana@example.com',
    ...overrides,
  })

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastAccessAt: user.lastAccessAt?.toISOString(),
  }
}

export function userDetailsResponse({
  user: userOverrides = {},
  auditRecords = [],
}: {
  user?: Partial<User>
  auditRecords?: readonly UserAuditRecord[]
} = {}): UserDetails {
  const user = UserFaker.fake({
    id: 'user-operator',
    establishmentId: 'browser-establishment-id',
    name: 'Ana Operator',
    email: 'ana@example.com',
    ...userOverrides,
  })

  return {
    user,
    auditRecords: auditRecords.map((record) => record),
  }
}

export function userDetailsJson({
  user: userOverrides = {},
  auditRecords = [
    UserAuditRecordFaker.fake({
      establishmentId: 'browser-establishment-id',
      affectedUserId: 'user-operator',
      affectedUserName: 'Ana Operator',
      actorUserId: 'browser-manager-id',
      actorName: 'Manager Browser',
    }),
  ],
}: {
  user?: Partial<User>
  auditRecords?: readonly UserAuditRecord[]
} = {}) {
  const details = userDetailsResponse({ user: userOverrides, auditRecords })

  return {
    user: userResponse(details.user),
    auditRecords: details.auditRecords.map((record) => ({
      ...record,
      occurredAt: record.occurredAt.toISOString(),
    })),
  }
}

export function usersPageJson(
  users = [
    UserFaker.fake({
      id: 'manager-1',
      establishmentId: 'browser-establishment-id',
      name: 'Carla Manager',
      email: 'carla@example.com',
      profile: 'manager',
    }),
    UserFaker.fake({
      id: 'operator-1',
      establishmentId: 'browser-establishment-id',
      name: 'Ana Operator',
      email: 'ana@example.com',
      profile: 'operator',
      lastAccessAt: undefined,
    }),
    UserFaker.fake({
      id: 'pending-1',
      establishmentId: 'browser-establishment-id',
      name: 'Pedro Pending',
      email: 'pedro@example.com',
      profile: 'operator',
      status: 'pending',
      lastAccessAt: undefined,
    }),
  ],
) {
  return {
    items: users.map((user) => userResponse(user)),
    page: 1,
    pageSize: 10,
    total: users.length,
    totalPages: users.length === 0 ? 0 : 1,
  }
}

export function pendingOnboarding(
  overrides: Partial<PendingIceCreamShopOnboarding> = {},
) {
  const attempt = UserRegistrationAttemptFaker.fake({
    id: 'registration-attempt-1',
    userId: 'user-manager',
    establishmentId: 'browser-establishment-id',
    name: 'Marina Manager',
    email: 'marina@example.com',
    expiresAt: new Date('2026-08-20T12:00:00.000Z'),
  })

  return {
    establishmentName: 'Gelato Central',
    managerName: attempt.name,
    email: attempt.email,
    expiresAt: attempt.expiresAt,
    ...overrides,
  }
}

export function onboardingRegistration(
  overrides: Partial<{
    continuationToken: string
    onboarding: PendingIceCreamShopOnboarding
  }> = {},
) {
  return {
    continuationToken: 'a'.repeat(43),
    onboarding: pendingOnboarding(),
    ...overrides,
  }
}
