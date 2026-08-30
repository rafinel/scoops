export const OrderStatus = {
  Registered: 'registered',
  Canceled: 'canceled',
} as const

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]
