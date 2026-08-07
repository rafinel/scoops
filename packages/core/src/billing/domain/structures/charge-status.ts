export const ChargeStatus = {
  Pending: 'pending',
  Paid: 'paid',
  Failed: 'failed',
  Overdue: 'overdue',
  Refunded: 'refunded',
  Chargeback: 'chargeback',
} as const

export type ChargeStatus = (typeof ChargeStatus)[keyof typeof ChargeStatus]
