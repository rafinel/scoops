import type { BillingNotification } from '#billing/domain/structures/billing-notification.ts'

export interface BillingNotificationProvider {
  send(notification: BillingNotification): Promise<void>
}
