export const PaymentMethodType = {
  Card: 'card',
  AutomaticPix: 'automatic-pix',
} as const

export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType]
