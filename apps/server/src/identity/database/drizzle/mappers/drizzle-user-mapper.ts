import type { User } from '@scoops/core/identity/domain/entities'

import type { DrizzleUser } from '@/identity/database/drizzle/types/entities'

export class DrizzleUserMapper {
  static toDomain(record: DrizzleUser): User {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      name: record.name,
      email: record.email,
      profile: record.profile,
      status: record.status,
      lastAccessAt: record.lastAccessAt ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
