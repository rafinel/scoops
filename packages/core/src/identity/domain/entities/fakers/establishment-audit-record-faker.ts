import { faker } from '@faker-js/faker'

import type { EstablishmentAuditRecord } from '#identity/domain/entities/establishment-audit-record.ts'
import { EstablishmentAuditAction } from '#identity/domain/structures/establishment-audit-action.ts'
import { UserAuditActorType } from '#identity/domain/structures/user-audit-actor-type.ts'

export class EstablishmentAuditRecordFaker {
  static fake(
    overrides: Partial<EstablishmentAuditRecord> = {},
  ): EstablishmentAuditRecord {
    return {
      id: faker.string.uuid(),
      establishmentId: faker.string.uuid(),
      affectedEstablishmentName: faker.company.name(),
      actorType: UserAuditActorType.User,
      actorUserId: faker.string.uuid(),
      actorName: faker.person.fullName(),
      action: EstablishmentAuditAction.EstablishmentNameChanged,
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    }
  }

  static fakeMany(count = 10): EstablishmentAuditRecord[] {
    return Array.from({ length: count }, () => EstablishmentAuditRecordFaker.fake())
  }
}
