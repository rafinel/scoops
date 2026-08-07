export const DiscountComponentKind = {
  Portion: 'portion',
  Resale: 'resale',
} as const

export type DiscountComponentKind =
  (typeof DiscountComponentKind)[keyof typeof DiscountComponentKind]
