export const ProductStockAlertState = {
  Normal: 'normal',
  BelowIdeal: 'below-ideal',
  Zero: 'zero',
} as const

export type ProductStockAlertState =
  (typeof ProductStockAlertState)[keyof typeof ProductStockAlertState]
