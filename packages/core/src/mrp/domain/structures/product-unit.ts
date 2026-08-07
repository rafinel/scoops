export const ProductUnit = {
  Gram: 'g',
  Milliliter: 'ml',
  Kilogram: 'kg',
  Liter: 'l',
  Unit: 'un',
} as const

export type ProductUnit = (typeof ProductUnit)[keyof typeof ProductUnit]
