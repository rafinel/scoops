import type { UserRegistrationAttempt } from '@scoops/core/identity/domain/entities'

import type { DrizzleUserRegistrationAttempt } from '@/identity/database/drizzle/types/entities'

export class DrizzleUserRegistrationAttemptMapper {
  static toDomain(record: DrizzleUserRegistrationAttempt): UserRegistrationAttempt {
    return {
      id: record.id,
      userId: record.userId,
      establishmentId: record.establishmentId,
      name: record.name,
      email: record.email,
      profile: record.profile,
      type: record.type,
      status: record.status,
      tokenHash: record.tokenHash,
      confirmationTokenHash: record.confirmationTokenHash ?? undefined,
      supersededProviderSubject: record.supersededProviderSubject ?? undefined,
      cleanupClaimToken: record.cleanupClaimToken ?? undefined,
      cleanupClaimedAt: record.cleanupClaimedAt ?? undefined,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
