export const SubscriptionStatus = {
  Trial: 'trial',
  InitialPaymentPending: 'initial-payment-pending',
  Active: 'active',
  GracePeriod: 'grace-period',
  CancellationScheduled: 'cancellation-scheduled',
  Blocked: 'blocked',
  DeletionScheduled: 'deletion-scheduled',
  Deleted: 'deleted',
} as const

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]
