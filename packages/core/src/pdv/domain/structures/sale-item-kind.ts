export const SaleItemKind = {
  Portion: 'portion',
  Resale: 'resale',
} as const

export type SaleItemKind = (typeof SaleItemKind)[keyof typeof SaleItemKind]
