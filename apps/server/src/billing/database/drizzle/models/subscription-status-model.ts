import {
  SubscriptionStatus,
  type SubscriptionStatus as SubscriptionStatusValue,
} from '@scoops/core/billing/domain/structures'
import { pgEnum } from 'drizzle-orm/pg-core'

export const subscriptionStatusModel = pgEnum(
  'billing_subscription_status',
  Object.values(SubscriptionStatus) as [
    SubscriptionStatusValue,
    ...SubscriptionStatusValue[],
  ],
)
