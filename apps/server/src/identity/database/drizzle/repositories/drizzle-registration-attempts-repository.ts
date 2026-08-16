import type {
  UserRegistrationAttempt,
  UserRegistrationAttemptCreate,
  UserRegistrationAttemptUpdate,
} from '@scoops/core/identity/domain/entities'
import type { RegistrationAttemptsRepository } from '@scoops/core/identity/interfaces'
import {
  InvitationOperation,
  RegistrationAttemptType,
  RegistrationAttemptStatus,
} from '@scoops/core/identity/domain/structures'
import {
  and,
  asc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lte,
  lt,
  or,
  sql,
} from 'drizzle-orm'
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

  async findPendingExpiredByType(input: {
    type: (typeof RegistrationAttemptType)[keyof typeof RegistrationAttemptType]
    cutoff: Date
    limit: number
  }): Promise<UserRegistrationAttempt[]> {
    if (input.limit <= 0) return []

    const records = await this.database
      .select()
      .from(userRegistrationAttemptModel)
      .where(
        and(
          eq(userRegistrationAttemptModel.type, input.type),
          eq(userRegistrationAttemptModel.status, RegistrationAttemptStatus.Pending),
          lte(userRegistrationAttemptModel.expiresAt, input.cutoff),
        ),
      )
      .orderBy(asc(userRegistrationAttemptModel.expiresAt))
      .limit(input.limit)

    return records.map(DrizzleUserRegistrationAttemptMapper.toDomain)
  }

  async findStaleInvitationOperations(input: {
    staleBefore: Date
    limit: number
  }): Promise<UserRegistrationAttempt[]> {
    if (input.limit <= 0) return []

    const records = await this.database
      .select()
      .from(userRegistrationAttemptModel)
      .where(
        and(
          eq(userRegistrationAttemptModel.type, RegistrationAttemptType.UserInvitation),
          eq(userRegistrationAttemptModel.status, RegistrationAttemptStatus.Pending),
          isNotNull(userRegistrationAttemptModel.operation),
          lt(userRegistrationAttemptModel.operationClaimedAt, input.staleBefore),
        ),
      )
      .orderBy(asc(userRegistrationAttemptModel.operationClaimedAt))
      .limit(input.limit)

    return records.map(DrizzleUserRegistrationAttemptMapper.toDomain)
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
        eq(
          userRegistrationAttemptModel.type,
          RegistrationAttemptType.EstablishmentOnboarding,
        ),
        eq(userRegistrationAttemptModel.status, RegistrationAttemptStatus.Pending),
        lte(userRegistrationAttemptModel.expiresAt, input.cutoff),
      ),
      and(
        eq(
          userRegistrationAttemptModel.type,
          RegistrationAttemptType.EstablishmentOnboarding,
        ),
        eq(userRegistrationAttemptModel.status, RegistrationAttemptStatus.Expired),
      ),
      and(
        eq(
          userRegistrationAttemptModel.type,
          RegistrationAttemptType.EstablishmentOnboarding,
        ),
        isNotNull(userRegistrationAttemptModel.supersededProviderSubject),
      ),
    )
    const leaseCondition = or(
      isNull(userRegistrationAttemptModel.cleanupClaimedAt),
      lt(userRegistrationAttemptModel.cleanupClaimedAt, input.staleBefore),
    )
    const operationLeaseCondition = or(
      isNull(userRegistrationAttemptModel.operationClaimedAt),
      lt(userRegistrationAttemptModel.operationClaimedAt, input.staleBefore),
    )
    const candidates = await this.database
      .select({ id: userRegistrationAttemptModel.id })
      .from(userRegistrationAttemptModel)
      .where(and(candidateCondition, leaseCondition, operationLeaseCondition))
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

  async claimInvitationOperation(input: {
    attemptId: string
    expectedRevision: number
    operation: InvitationOperation
    operationToken: string
    claimedAt: Date
    staleBefore: Date
    pendingEmail?: string
    pendingTokenHash?: string
    pendingExpiresAt?: Date
  }): Promise<UserRegistrationAttempt | undefined> {
    const operationIsExpiry = input.operation === InvitationOperation.Expire
    const expiryCondition = operationIsExpiry
      ? lte(userRegistrationAttemptModel.expiresAt, input.claimedAt)
      : gt(userRegistrationAttemptModel.expiresAt, input.claimedAt)
    const [record] = await this.database
      .update(userRegistrationAttemptModel)
      .set({
        operation: input.operation,
        operationToken: input.operationToken,
        operationClaimedAt: input.claimedAt,
        pendingEmail: input.pendingEmail ?? null,
        pendingTokenHash: input.pendingTokenHash ?? null,
        pendingExpiresAt: input.pendingExpiresAt ?? null,
        revision: sql`${userRegistrationAttemptModel.revision} + 1`,
        updatedAt: input.claimedAt,
      })
      .where(
        and(
          eq(userRegistrationAttemptModel.id, input.attemptId),
          eq(userRegistrationAttemptModel.status, RegistrationAttemptStatus.Pending),
          eq(userRegistrationAttemptModel.revision, input.expectedRevision),
          expiryCondition,
          or(
            isNull(userRegistrationAttemptModel.operation),
            lt(userRegistrationAttemptModel.operationClaimedAt, input.staleBefore),
          ),
        ),
      )
      .returning()

    return record ? DrizzleUserRegistrationAttemptMapper.toDomain(record) : undefined
  }

  async finalizeInvitationOperation(input: {
    attemptId: string
    operationToken: string
    changes: UserRegistrationAttemptUpdate
  }): Promise<UserRegistrationAttempt | undefined> {
    const persistenceChanges = Object.fromEntries(
      Object.entries(input.changes).map(([key, value]) => [
        key,
        value === undefined ? null : value,
      ]),
    )
    const [record] = await this.database
      .update(userRegistrationAttemptModel)
      .set({
        ...persistenceChanges,
        operation: null,
        operationToken: null,
        operationClaimedAt: null,
        pendingEmail: null,
        pendingTokenHash: null,
        pendingExpiresAt: null,
      })
      .where(
        and(
          eq(userRegistrationAttemptModel.id, input.attemptId),
          eq(userRegistrationAttemptModel.operationToken, input.operationToken),
        ),
      )
      .returning()

    return record ? DrizzleUserRegistrationAttemptMapper.toDomain(record) : undefined
  }

  async clearInvitationOperation(input: {
    attemptId: string
    operationToken: string
    updatedAt: Date
  }): Promise<boolean> {
    const records = await this.database
      .update(userRegistrationAttemptModel)
      .set({
        operation: null,
        operationToken: null,
        operationClaimedAt: null,
        pendingEmail: null,
        pendingTokenHash: null,
        pendingExpiresAt: null,
        updatedAt: input.updatedAt,
      })
      .where(
        and(
          eq(userRegistrationAttemptModel.id, input.attemptId),
          eq(userRegistrationAttemptModel.operationToken, input.operationToken),
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
