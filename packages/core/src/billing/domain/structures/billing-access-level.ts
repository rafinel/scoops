export const BillingAccessLevel = {
  Full: 'full',
  Restricted: 'restricted',
  None: 'none',
} as const

export type BillingAccessLevel =
  (typeof BillingAccessLevel)[keyof typeof BillingAccessLevel]
