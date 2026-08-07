export const PaymentMethodStatus = {
  Active: 'active',
  Pending: 'pending',
  Failed: 'failed',
  Cancelled: 'cancelled',
} as const

export type PaymentMethodStatus =
  (typeof PaymentMethodStatus)[keyof typeof PaymentMethodStatus]
