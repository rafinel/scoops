import type { PaymentMethodType } from '#billing/domain/structures/payment-method-type.ts'

export type BillingPaymentMethodChange = {
  readonly establishmentId: string
  readonly subscriptionId: string
  readonly type: PaymentMethodType
  readonly returnUrl: string
  readonly cancelUrl: string
}
