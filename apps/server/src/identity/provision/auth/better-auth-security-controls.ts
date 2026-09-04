import { createHash } from 'node:crypto'
import { Injectable, Optional } from '@nestjs/common'
import { eq, sql } from 'drizzle-orm'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'
import { ResolveAuthenticatedUserUseCase } from '@scoops/core/identity/use-cases'

import { betterAuthMessageQuotaModel } from '@/identity/database/drizzle/models/better-auth-message-quota-model'
import { betterAuthSignInAttemptModel } from '@/identity/database/drizzle/models/better-auth-sign-in-attempt-model'
import { betterAuthUserModel } from '@/identity/database/drizzle/models/better-auth-user-model'
import type { Database } from '@/shared/database/drizzle/drizzle-client'
import { DatabaseTransactionContext } from '@/shared/database/drizzle/database-transaction-context'
import type { DrizzleExecutor } from '@/shared/database/drizzle/drizzle-repository'

const LOCKOUT_DURATION_MS = 15 * 60 * 1000
const MESSAGE_WINDOW_MS = 24 * 60 * 60 * 1000
const MESSAGE_SPACING_MS = 2 * 60 * 1000
const MESSAGE_LIMIT = 3

@Injectable()
export class BetterAuthSecurityControls {
  private readonly resolveAuthenticatedUser: ResolveAuthenticatedUserUseCase

  constructor(
    identityDatabase: IdentityDatabase,
    private readonly database: Database,
    @Optional()
    private readonly transactionContext?: DatabaseTransactionContext,
  ) {
    this.resolveAuthenticatedUser = new ResolveAuthenticatedUserUseCase(identityDatabase)
  }

  async isSessionEligible(userId: string): Promise<boolean> {
    return Boolean(
      await this.resolveAuthenticatedUser.execute({ providerSubject: userId }),
    )
  }

  async getUserEmail(userId: string): Promise<string | undefined> {
    const rows = await this.currentDatabase
      .select({ email: betterAuthUserModel.email })
      .from(betterAuthUserModel)
      .where(eq(betterAuthUserModel.id, userId))
      .limit(1)
    return rows[0]?.email
  }

  async isSignInLocked(email: string, now = new Date()): Promise<boolean> {
    const attempt = await this.findSignInAttempt(email)
    return Boolean(attempt?.lockedUntil && attempt.lockedUntil.getTime() > now.getTime())
  }

  async recordSignInFailure(email: string, now = new Date()): Promise<void> {
    const identifierHash = this.hashIdentifier(email)
    const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS)

    await this.currentDatabase
      .insert(betterAuthSignInAttemptModel)
      .values({
        identifierHash,
        failedAttempts: 1,
        lastFailedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: betterAuthSignInAttemptModel.identifierHash,
        set: {
          failedAttempts: sql`least(${betterAuthSignInAttemptModel.failedAttempts} + 1, 5)`,
          lockedUntil: sql`case when ${betterAuthSignInAttemptModel.failedAttempts} + 1 >= 5 then ${lockedUntil.toISOString()}::timestamptz else ${betterAuthSignInAttemptModel.lockedUntil} end`,
          lastFailedAt: now,
          updatedAt: now,
        },
      })
  }

  async recordSignInSuccess(userId: string): Promise<void> {
    const user = await this.currentDatabase
      .select({ email: betterAuthUserModel.email })
      .from(betterAuthUserModel)
      .where(eq(betterAuthUserModel.id, userId))
      .limit(1)
    if (!user[0]) return

    await this.currentDatabase
      .delete(betterAuthSignInAttemptModel)
      .where(
        eq(
          betterAuthSignInAttemptModel.identifierHash,
          this.hashIdentifier(user[0].email),
        ),
      )
  }

  async consumeMessageQuota(
    identifier: string,
    kind: 'verification' | 'recovery' | 'invitation',
    now = new Date(),
  ): Promise<boolean> {
    const database = this.transactionContext?.get()
    const execute = async (transaction: DrizzleExecutor) => {
      const identifierHash = this.hashIdentifier(identifier)
      const rows = await transaction
        .select()
        .from(betterAuthMessageQuotaModel)
        .where(eq(betterAuthMessageQuotaModel.identifierHash, identifierHash))
        .for('update')
      const current = rows[0]

      if (!current) {
        await transaction.insert(betterAuthMessageQuotaModel).values({
          identifierHash,
          windowStartedAt: now,
          sentCount: 1,
          lastSentAt: now,
          lastKind: kind,
          updatedAt: now,
        })
        return true
      }

      if (now.getTime() - current.windowStartedAt.getTime() >= MESSAGE_WINDOW_MS) {
        await transaction
          .update(betterAuthMessageQuotaModel)
          .set({
            windowStartedAt: now,
            sentCount: 1,
            lastSentAt: now,
            lastKind: kind,
            updatedAt: now,
          })
          .where(eq(betterAuthMessageQuotaModel.identifierHash, identifierHash))
        return true
      }

      if (
        current.sentCount >= MESSAGE_LIMIT ||
        (current.lastSentAt &&
          now.getTime() - current.lastSentAt.getTime() < MESSAGE_SPACING_MS)
      ) {
        return false
      }

      await transaction
        .update(betterAuthMessageQuotaModel)
        .set({
          sentCount: current.sentCount + 1,
          lastSentAt: now,
          lastKind: kind,
          updatedAt: now,
        })
        .where(eq(betterAuthMessageQuotaModel.identifierHash, identifierHash))
      return true
    }

    if (database) return execute(database)
    return this.database.transaction((transaction) =>
      execute(transaction as DrizzleExecutor),
    )
  }

  private findSignInAttempt(email: string) {
    return this.currentDatabase
      .select()
      .from(betterAuthSignInAttemptModel)
      .where(eq(betterAuthSignInAttemptModel.identifierHash, this.hashIdentifier(email)))
      .limit(1)
      .then((rows) => rows[0])
  }

  private hashIdentifier(identifier: string): string {
    return createHash('sha256').update(identifier.trim().toLowerCase()).digest('hex')
  }

  private get currentDatabase(): Database | DrizzleExecutor {
    return this.transactionContext?.get() ?? this.database
  }
}
