import type { EstablishmentAuditRecord } from '@scoops/core/identity/domain/entities'

import type { DrizzleEstablishmentAuditRecord } from '@/identity/database/drizzle/types/entities'

export class DrizzleEstablishmentAuditRecordMapper {
  static toDomain(record: DrizzleEstablishmentAuditRecord): EstablishmentAuditRecord {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      affectedEstablishmentName: record.affectedEstablishmentName,
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
