export const SalesCatalogAvailability = {
  Available: 'available',
  OutOfStock: 'out_of_stock',
  MissingPrice: 'missing_price',
} as const

export type SalesCatalogAvailability =
  (typeof SalesCatalogAvailability)[keyof typeof SalesCatalogAvailability]
