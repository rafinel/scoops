import type {
  Subscription,
  SubscriptionCreate,
  SubscriptionUpdate,
} from '@scoops/core/billing/domain/entities'
import { ConflictError } from '@scoops/core/shared/domain/errors'
import type { SubscriptionsRepository } from '@scoops/core/billing/interfaces'
import { eq } from 'drizzle-orm'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { DrizzleSubscriptionMapper } from '@/billing/database/drizzle/mappers/drizzle-subscription-mapper'
import { subscriptionModel } from '@/billing/database/drizzle/models/subscription-model'

@Injectable()
export class DrizzleSubscriptionsRepository
  extends DrizzleRepository
  implements SubscriptionsRepository
{
  async add(input: SubscriptionCreate): Promise<Subscription> {
    try {
      const now = new Date()
      const [record] = await this.database
        .insert(subscriptionModel)
        .values({
          id: crypto.randomUUID(),
          establishmentId: input.establishmentId,
          planCode: input.planCode,
          status: input.status,
          trialStartedAt: input.trialStartedAt ?? null,
          trialEndsAt: input.trialEndsAt ?? null,
          currentPeriodStartedAt: input.currentPeriodStartedAt ?? null,
          currentPeriodEndsAt: input.currentPeriodEndsAt ?? null,
          graceEndsAt: input.graceEndsAt ?? null,
          cancellationScheduledAt: input.cancellationScheduledAt ?? null,
          retentionEndsAt: input.retentionEndsAt ?? null,
          providerCustomerId: input.providerCustomerId ?? null,
          providerSubscriptionId: input.providerSubscriptionId ?? null,
          paymentMethod: input.paymentMethod ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      return DrizzleSubscriptionMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async findById(subscriptionId: string): Promise<Subscription | undefined> {
    const [record] = await this.database
      .select()
      .from(subscriptionModel)
      .where(eq(subscriptionModel.id, subscriptionId))
      .limit(1)

    return record ? DrizzleSubscriptionMapper.toDomain(record) : undefined
  }

  async findByEstablishmentId(
    establishmentId: string,
  ): Promise<Subscription | undefined> {
    const [record] = await this.database
      .select()
      .from(subscriptionModel)
      .where(eq(subscriptionModel.establishmentId, establishmentId))
      .limit(1)

    return record ? DrizzleSubscriptionMapper.toDomain(record) : undefined
  }

  async findByProviderSubscriptionId(
    providerSubscriptionId: string,
  ): Promise<Subscription | undefined> {
    const [record] = await this.database
      .select()
      .from(subscriptionModel)
      .where(eq(subscriptionModel.providerSubscriptionId, providerSubscriptionId))
      .limit(1)

    return record ? DrizzleSubscriptionMapper.toDomain(record) : undefined
  }

  async replace(
    establishmentId: string,
    changes: SubscriptionUpdate,
  ): Promise<Subscription> {
    try {
      const [record] = await this.database
        .update(subscriptionModel)
        .set({
          ...changes,
          trialStartedAt: changes.trialStartedAt,
          trialEndsAt: changes.trialEndsAt,
          currentPeriodStartedAt: changes.currentPeriodStartedAt,
          currentPeriodEndsAt: changes.currentPeriodEndsAt,
          graceEndsAt: changes.graceEndsAt,
          cancellationScheduledAt: changes.cancellationScheduledAt,
          retentionEndsAt: changes.retentionEndsAt,
          providerCustomerId: changes.providerCustomerId,
          providerSubscriptionId: changes.providerSubscriptionId,
          paymentMethod: changes.paymentMethod,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionModel.establishmentId, establishmentId))
        .returning()

      if (!record) throw new ConflictError('A assinatura não foi encontrada.')
      return DrizzleSubscriptionMapper.toDomain(record)
    } catch (error) {
      throw this.toConflictError(error)
    }
  }

  async removeAll(): Promise<void> {
    await this.database.delete(subscriptionModel)
  }

  private toConflictError(error: unknown): unknown {
    if (this.isIntegrityConstraintError(error)) {
      return new ConflictError('A operação no banco de dados entrou em conflito.')
    }
    return error
  }

  private isIntegrityConstraintError(error: unknown): boolean {
    let currentError: unknown = error
    while (currentError && typeof currentError === 'object') {
      if (
        'code' in currentError &&
        (currentError.code === '23505' ||
          currentError.code === '23503' ||
          currentError.code === '23514')
      ) {
        return true
      }
      if (!('cause' in currentError)) return false
      currentError = currentError.cause
    }
    return false
  }
}
