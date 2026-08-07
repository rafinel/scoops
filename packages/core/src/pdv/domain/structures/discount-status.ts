export const DiscountStatus = {
  Active: 'active',
  Inactive: 'inactive',
} as const

export type DiscountStatus = (typeof DiscountStatus)[keyof typeof DiscountStatus]
