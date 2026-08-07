export const ProductStatus = {
  Active: 'active',
  Inactive: 'inactive',
} as const

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus]
