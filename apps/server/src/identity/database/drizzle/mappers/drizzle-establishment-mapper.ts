import type { Establishment } from '@scoops/core/identity/domain/entities'

import type { DrizzleEstablishment } from '@/identity/database/drizzle/types/entities'

export class DrizzleEstablishmentMapper {
  static toDomain(record: DrizzleEstablishment): Establishment {
    return {
      id: record.id,
      name: record.name,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      activatedAt: record.activatedAt ?? undefined,
    }
  }
}
