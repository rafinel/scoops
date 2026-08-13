import type { UserRegistrationAttempt } from '@scoops/core/identity/domain/entities'

import type { DrizzleUserRegistrationAttempt } from '@/identity/database/drizzle/types/entities'

export class DrizzleUserRegistrationAttemptMapper {
  static toDomain(record: DrizzleUserRegistrationAttempt): UserRegistrationAttempt {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      name: record.name,
      email: record.email,
      profile: record.profile,
      type: record.type,
      status: record.status,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
