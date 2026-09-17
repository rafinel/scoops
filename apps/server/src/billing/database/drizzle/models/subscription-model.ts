import type { PaymentMethodSnapshot } from '@scoops/core/billing/domain/structures'
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { billingPlanCodeModel } from '@/billing/database/drizzle/models/billing-plan-code-model'
import { subscriptionStatusModel } from '@/billing/database/drizzle/models/subscription-status-model'

export const subscriptionModel = pgTable(
  'billing_subscriptions',
  {
    id: uuid('id').primaryKey(),
    establishmentId: uuid('establishment_id').notNull(),
    planCode: billingPlanCodeModel('plan_code').notNull(),
    status: subscriptionStatusModel('status').notNull(),
    trialStartedAt: timestamp('trial_started_at', { withTimezone: true, mode: 'date' }),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true, mode: 'date' }),
    currentPeriodStartedAt: timestamp('current_period_started_at', {
      withTimezone: true,
      mode: 'date',
    }),
    currentPeriodEndsAt: timestamp('current_period_ends_at', {
      withTimezone: true,
      mode: 'date',
    }),
    graceEndsAt: timestamp('grace_ends_at', { withTimezone: true, mode: 'date' }),
    cancellationScheduledAt: timestamp('cancellation_scheduled_at', {
      withTimezone: true,
      mode: 'date',
    }),
    retentionEndsAt: timestamp('retention_ends_at', { withTimezone: true, mode: 'date' }),
    providerCustomerId: text('provider_customer_id'),
    providerSubscriptionId: text('provider_subscription_id'),
    paymentMethod: jsonb('payment_method').$type<PaymentMethodSnapshot>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('billing_subscriptions_establishment_unique').on(table.establishmentId),
    uniqueIndex('billing_subscriptions_provider_subscription_unique').on(
      table.providerSubscriptionId,
    ),
    index('billing_subscriptions_status_idx').on(table.status),
  ],
)
