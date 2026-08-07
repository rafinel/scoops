import type { BillingAccessLevel } from '#billing/domain/structures/billing-access-level.ts'
import type { SubscriptionStatus } from '#billing/domain/structures/subscription-status.ts'

export type BillingAccess = {
  readonly level: BillingAccessLevel
  readonly status: SubscriptionStatus
  readonly reason?: string
  readonly retentionEndsAt?: Date
}
