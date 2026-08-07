export const StockAdjustmentType = {
  Entry: 'entry',
  WriteOff: 'write-off',
} as const

export type StockAdjustmentType =
  (typeof StockAdjustmentType)[keyof typeof StockAdjustmentType]
