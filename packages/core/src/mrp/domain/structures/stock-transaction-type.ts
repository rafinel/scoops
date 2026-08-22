export const StockTransactionType = {
  Entry: 'entry',
  WriteOff: 'write-off',
  ProductionConsumption: 'production-consumption',
  ProductionOutput: 'production-output',
} as const

export type StockTransactionType =
  (typeof StockTransactionType)[keyof typeof StockTransactionType]
