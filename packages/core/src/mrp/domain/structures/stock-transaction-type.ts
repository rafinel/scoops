export const StockTransactionType = {
  Entry: 'entry',
  WriteOff: 'write-off',
  ProductionConsumption: 'production-consumption',
  ProductionOutput: 'production-output',
  Sale: 'sale',
  SaleCancellation: 'sale-cancellation',
} as const

export type StockTransactionType =
  (typeof StockTransactionType)[keyof typeof StockTransactionType]
