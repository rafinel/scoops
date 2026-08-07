export const BillingHolderType = {
  Individual: 'individual',
  Company: 'company',
} as const

export type BillingHolderType = (typeof BillingHolderType)[keyof typeof BillingHolderType]
