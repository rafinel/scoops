import type { BillingPlanCode } from '#billing/domain/structures/billing-plan.ts'
import type { BillingProviderCustomer } from '#billing/domain/structures/billing-provider-customer.ts'

export type BillingCheckoutRequest = {
  readonly establishmentId: string
  readonly planCode: BillingPlanCode
  readonly customer: BillingProviderCustomer
  readonly returnUrl: string
  readonly cancelUrl: string
}
