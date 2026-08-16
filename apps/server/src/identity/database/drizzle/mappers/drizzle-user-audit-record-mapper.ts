import type { UserAuditRecord } from '@scoops/core/identity/domain/entities'

import type { DrizzleUserAuditRecord } from '@/identity/database/drizzle/types/entities'

export class DrizzleUserAuditRecordMapper {
  static toDomain(record: DrizzleUserAuditRecord): UserAuditRecord {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      affectedUserId: record.affectedUserId,
      affectedUserName: record.affectedUserName,
      actorType: record.actorType,
      actorUserId: record.actorUserId ?? undefined,
      actorName: record.actorName,
      action: record.action,
      previousValue: record.previousValue ?? undefined,
      newValue: record.newValue ?? undefined,
      occurredAt: record.occurredAt,
    }
  }
}
