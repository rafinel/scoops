import { faker } from '@faker-js/faker'
import type { UserAuditRecord } from '#identity/domain/entities/user-audit-record.ts'
import { UserAuditAction } from '#identity/domain/structures/user-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'

export class UserAuditRecordFaker {
  static fake(overrides: Partial<UserAuditRecord> = {}): UserAuditRecord {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      affectedUserId: faker.string.uuid(),
      affectedUserName: faker.person.fullName(),
      actorType: UserAuditActorType.User,
      actorUserId: faker.string.uuid(),
      actorName: faker.person.fullName(),
      action: UserAuditAction.UserRegistered,
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): UserAuditRecord[] {
    return Array.from({ length: count }, () => UserAuditRecordFaker.fake())
  }
}
