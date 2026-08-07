export const ProductCategory = {
  Ingredient: 'ingredient',
  Manufacturable: 'manufacturable',
  Portion: 'portion',
  Accompaniment: 'accompaniment',
  Resale: 'resale',
} as const

export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory]
