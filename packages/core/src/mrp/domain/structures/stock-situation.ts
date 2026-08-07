export const StockSituation = {
  Normal: 'normal',
  Low: 'low',
} as const

export type StockSituation = (typeof StockSituation)[keyof typeof StockSituation]
