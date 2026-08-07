import type { BillingPaymentMethodChange } from '#billing/domain/structures/billing-payment-method-change.ts'
import type { BillingCheckoutRequest } from '#billing/domain/structures/billing-checkout-request.ts'
import type { BillingProviderEvent } from '#billing/domain/structures/billing-provider-event.ts'
import type { CheckoutSession } from '#billing/domain/structures/checkout-session.ts'
import type { PaymentMethodType } from '#billing/domain/structures/payment-method-type.ts'

export interface BillingProvider {
  createCheckout(request: BillingCheckoutRequest): Promise<CheckoutSession>
  changePaymentMethod(request: BillingPaymentMethodChange): Promise<CheckoutSession>
  cancelSubscription(providerSubscriptionId: string): Promise<void>
  resumeSubscription(providerSubscriptionId: string): Promise<void>
  refundCharge(providerChargeId: string): Promise<void>
  createPaymentLink(
    establishmentId: string,
    subscriptionId: string,
    paymentMethodType: PaymentMethodType,
  ): Promise<CheckoutSession>
  verifyWebhook(
    headers: Readonly<Record<string, string>>,
    body: unknown,
  ): BillingProviderEvent
}
