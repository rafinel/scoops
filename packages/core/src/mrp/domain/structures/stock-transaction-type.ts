export const StockTransactionType = {
  Entry: 'entry',
  WriteOff: 'write-off',
  ProductionConsumption: 'production-consumption',
  ProductionOutput: 'production-output',
  Sale: 'sale',
} as const

export type StockTransactionType =
  (typeof StockTransactionType)[keyof typeof StockTransactionType]
