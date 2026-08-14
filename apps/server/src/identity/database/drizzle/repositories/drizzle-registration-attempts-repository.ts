import type {
  UserRegistrationAttempt,
  UserRegistrationAttemptCreate,
  UserRegistrationAttemptUpdate,
} from '@scoops/core/identity/domain/entities'
import type { RegistrationAttemptsRepository } from '@scoops/core/identity/interfaces'
import { RegistrationAttemptStatus } from '@scoops/core/identity/domain/structures'
import { and, asc, eq, inArray, isNotNull, isNull, lte, lt, or, sql } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleUserRegistrationAttemptMapper } from '@/identity/database/drizzle/mappers/drizzle-user-registration-attempt-mapper'
import { userRegistrationAttemptModel } from '@/identity/database/drizzle/models/user-registration-attempt-model'

@Injectable()
export class DrizzleRegistrationAttemptsRepository
  extends DrizzleRepository
  implements RegistrationAttemptsRepository
{
  async add(input: UserRegistrationAttemptCreate): Promise<UserRegistrationAttempt> {
    const [record] = await this.database
      .insert(userRegistrationAttemptModel)
      .values(input)
      .returning()

    return DrizzleUserRegistrationAttemptMapper.toDomain(record)
  }

  async addMany(
    inputs: UserRegistrationAttemptCreate[],
  ): Promise<UserRegistrationAttempt[]> {
    if (inputs.length === 0) return []

    const records = await this.database
      .insert(userRegistrationAttemptModel)
      .values(inputs)
      .returning()

    return records.map(DrizzleUserRegistrationAttemptMapper.toDomain)
  }

  async findById(attemptId: string): Promise<UserRegistrationAttempt | undefined> {
    const [record] = await this.database
      .select()
      .from(userRegistrationAttemptModel)
      .where(eq(userRegistrationAttemptModel.id, attemptId))
      .limit(1)

    return record ? DrizzleUserRegistrationAttemptMapper.toDomain(record) : undefined
  }

  async findActiveByEmail(email: string): Promise<UserRegistrationAttempt | undefined> {
    const [record] = await this.database
      .select()
      .from(userRegistrationAttemptModel)
      .where(
        and(
          sql`lower(${userRegistrationAttemptModel.email}) = lower(${email})`,
          eq(userRegistrationAttemptModel.status, RegistrationAttemptStatus.Pending),
        ),
      )
      .limit(1)

    return record ? DrizzleUserRegistrationAttemptMapper.toDomain(record) : undefined
  }

  async findPendingByTokenHash(
    tokenHash: string,
  ): Promise<UserRegistrationAttempt | undefined> {
    const [record] = await this.database
      .select()
      .from(userRegistrationAttemptModel)
      .where(eq(userRegistrationAttemptModel.tokenHash, tokenHash))
      .limit(1)

    return record ? DrizzleUserRegistrationAttemptMapper.toDomain(record) : undefined
  }

  async findByUserId(userId: string): Promise<UserRegistrationAttempt | undefined> {
    const [record] = await this.database
      .select()
      .from(userRegistrationAttemptModel)
      .where(eq(userRegistrationAttemptModel.userId, userId))
      .limit(1)

    return record ? DrizzleUserRegistrationAttemptMapper.toDomain(record) : undefined
  }

  async claimForCleanup(input: {
    cutoff: Date
    staleBefore: Date
    claimedAt: Date
    claimToken: string
    limit: number
  }): Promise<UserRegistrationAttempt[]> {
    if (input.limit <= 0) return []

    const candidateCondition = or(
      and(
        eq(userRegistrationAttemptModel.status, RegistrationAttemptStatus.Pending),
        lte(userRegistrationAttemptModel.expiresAt, input.cutoff),
      ),
      eq(userRegistrationAttemptModel.status, RegistrationAttemptStatus.Expired),
      isNotNull(userRegistrationAttemptModel.supersededProviderSubject),
    )
    const leaseCondition = or(
      isNull(userRegistrationAttemptModel.cleanupClaimedAt),
      lt(userRegistrationAttemptModel.cleanupClaimedAt, input.staleBefore),
    )
    const candidates = await this.database
      .select({ id: userRegistrationAttemptModel.id })
      .from(userRegistrationAttemptModel)
      .where(and(candidateCondition, leaseCondition))
      .orderBy(asc(userRegistrationAttemptModel.expiresAt))
      .limit(input.limit)
      .for('update', { skipLocked: true })

    if (candidates.length === 0) return []

    const candidateIds = candidates.map((candidate) => candidate.id)
    const expiredIds = await this.database
      .select({ id: userRegistrationAttemptModel.id })
      .from(userRegistrationAttemptModel)
      .where(
        and(
          inArray(userRegistrationAttemptModel.id, candidateIds),
          eq(userRegistrationAttemptModel.status, RegistrationAttemptStatus.Pending),
          lte(userRegistrationAttemptModel.expiresAt, input.cutoff),
        ),
      )

    if (expiredIds.length > 0) {
      await this.database
        .update(userRegistrationAttemptModel)
        .set({
          status: RegistrationAttemptStatus.Expired,
          cleanupClaimToken: input.claimToken,
          cleanupClaimedAt: input.claimedAt,
          updatedAt: input.claimedAt,
        })
        .where(
          inArray(
            userRegistrationAttemptModel.id,
            expiredIds.map((candidate) => candidate.id),
          ),
        )
    }

    const notExpiredIds = candidateIds.filter(
      (candidateId) => !expiredIds.some((expired) => expired.id === candidateId),
    )
    if (notExpiredIds.length > 0) {
      await this.database
        .update(userRegistrationAttemptModel)
        .set({
          cleanupClaimToken: input.claimToken,
          cleanupClaimedAt: input.claimedAt,
          updatedAt: input.claimedAt,
        })
        .where(inArray(userRegistrationAttemptModel.id, notExpiredIds))
    }

    const records = await this.database
      .select()
      .from(userRegistrationAttemptModel)
      .where(inArray(userRegistrationAttemptModel.id, candidateIds))

    return records.map(DrizzleUserRegistrationAttemptMapper.toDomain)
  }

  async clearCleanupClaim(input: {
    attemptId: string
    claimToken: string
    updatedAt: Date
  }): Promise<boolean> {
    const records = await this.database
      .update(userRegistrationAttemptModel)
      .set({
        cleanupClaimToken: null,
        cleanupClaimedAt: null,
        updatedAt: input.updatedAt,
      })
      .where(
        and(
          eq(userRegistrationAttemptModel.id, input.attemptId),
          eq(userRegistrationAttemptModel.cleanupClaimToken, input.claimToken),
        ),
      )
      .returning({ id: userRegistrationAttemptModel.id })

    return records.length > 0
  }

  async clearSupersededProviderSubject(input: {
    attemptId: string
    claimToken: string
    supersededProviderSubject: string
    updatedAt: Date
  }): Promise<boolean> {
    const records = await this.database
      .update(userRegistrationAttemptModel)
      .set({
        supersededProviderSubject: null,
        cleanupClaimToken: null,
        cleanupClaimedAt: null,
        updatedAt: input.updatedAt,
      })
      .where(
        and(
          eq(userRegistrationAttemptModel.id, input.attemptId),
          eq(userRegistrationAttemptModel.cleanupClaimToken, input.claimToken),
          eq(
            userRegistrationAttemptModel.supersededProviderSubject,
            input.supersededProviderSubject,
          ),
        ),
      )
      .returning({ id: userRegistrationAttemptModel.id })

    return records.length > 0
  }

  async replace(
    attemptId: string,
    changes: UserRegistrationAttemptUpdate,
  ): Promise<UserRegistrationAttempt> {
    const persistenceChanges = Object.fromEntries(
      Object.entries(changes).map(([key, value]) => [
        key,
        value === undefined ? null : value,
      ]),
    )
    const [record] = await this.database
      .update(userRegistrationAttemptModel)
      .set(persistenceChanges)
      .where(eq(userRegistrationAttemptModel.id, attemptId))
      .returning()

    return DrizzleUserRegistrationAttemptMapper.toDomain(record)
  }

  async remove(attemptId: string): Promise<void> {
    await this.database
      .delete(userRegistrationAttemptModel)
      .where(eq(userRegistrationAttemptModel.id, attemptId))
  }

  async removeAll(): Promise<void> {
    await this.database.delete(userRegistrationAttemptModel)
  }
}
