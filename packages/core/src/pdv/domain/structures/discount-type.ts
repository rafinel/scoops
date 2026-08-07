export const DiscountType = {
  Combo: 'combo',
} as const

export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType]
