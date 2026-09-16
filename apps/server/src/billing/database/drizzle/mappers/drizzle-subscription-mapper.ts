import type { Subscription } from '@scoops/core/billing/domain/entities'

import type { DrizzleSubscription } from '@/billing/database/drizzle/types'

export class DrizzleSubscriptionMapper {
  static toDomain(record: DrizzleSubscription): Subscription {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      planCode: record.planCode,
      status: record.status,
      trialStartedAt: record.trialStartedAt ?? undefined,
      trialEndsAt: record.trialEndsAt ?? undefined,
      currentPeriodStartedAt: record.currentPeriodStartedAt ?? undefined,
      currentPeriodEndsAt: record.currentPeriodEndsAt ?? undefined,
      graceEndsAt: record.graceEndsAt ?? undefined,
      cancellationScheduledAt: record.cancellationScheduledAt ?? undefined,
      retentionEndsAt: record.retentionEndsAt ?? undefined,
      providerCustomerId: record.providerCustomerId ?? undefined,
      providerSubscriptionId: record.providerSubscriptionId ?? undefined,
      paymentMethod: record.paymentMethod ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
