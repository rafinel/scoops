export const ProductStockControl = {
  Single: 'single',
  ByBrand: 'by-brand',
} as const

export type ProductStockControl =
  (typeof ProductStockControl)[keyof typeof ProductStockControl]
