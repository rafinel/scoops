import type { PaymentMethodStatus } from '#billing/domain/structures/payment-method-status.ts'
import type { PaymentMethodType } from '#billing/domain/structures/payment-method-type.ts'

export type PaymentMethodSnapshot = {
  readonly type: PaymentMethodType
  readonly status: PaymentMethodStatus
  readonly brand?: string
  readonly lastFourDigits?: string
  readonly expirationMonth?: number
  readonly expirationYear?: number
}
