import type { Entity } from '#shared/domain/entities/entity.ts'
import type { BillingPlanCode } from '#billing/domain/structures/billing-plan.ts'
import type { PaymentMethodSnapshot } from '#billing/domain/structures/payment-method-snapshot.ts'
import type { SubscriptionStatus } from '#billing/domain/structures/subscription-status.ts'

export type Subscription = Entity & {
  establishmentId: string
  planCode: BillingPlanCode
  status: SubscriptionStatus
  trialStartedAt?: Date
  trialEndsAt?: Date
  currentPeriodStartedAt?: Date
  currentPeriodEndsAt?: Date
  graceEndsAt?: Date
  cancellationScheduledAt?: Date
  retentionEndsAt?: Date
  providerCustomerId?: string
  providerSubscriptionId?: string
  paymentMethod?: PaymentMethodSnapshot
  createdAt: Date
  updatedAt: Date
}

export type SubscriptionCreate = Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>

export type SubscriptionUpdate = Partial<
  Pick<
    Subscription,
    | 'status'
    | 'trialStartedAt'
    | 'trialEndsAt'
    | 'currentPeriodStartedAt'
    | 'currentPeriodEndsAt'
    | 'graceEndsAt'
    | 'cancellationScheduledAt'
    | 'retentionEndsAt'
    | 'providerCustomerId'
    | 'providerSubscriptionId'
    | 'paymentMethod'
  >
>
