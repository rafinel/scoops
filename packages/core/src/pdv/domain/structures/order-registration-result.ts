import type { Cart } from '#pdv/domain/structures/cart.ts'
import type { OrderDetails } from '#pdv/domain/structures/order-details.ts'
import type { OrderRegistrationChange } from '#pdv/domain/structures/order-registration-change.ts'
import type { OrderRegistrationInvalidConfiguration } from '#pdv/domain/structures/order-registration-invalid-configuration.ts'
import type { OrderRegistrationShortage } from '#pdv/domain/structures/order-registration-shortage.ts'

type RegisteredOrderResult = {
  readonly kind: 'registered'
  readonly order: OrderDetails
  readonly replayed: boolean
}

type RepricedOrderResult = {
  readonly kind: 'repriced'
  readonly recalculatedCart: Cart
  readonly previewToken: string
  readonly changes: readonly OrderRegistrationChange[]
}

type ReviewRequiredOrderResult = {
  readonly kind: 'review-required'
  readonly shortages: readonly OrderRegistrationShortage[]
  readonly changes: readonly OrderRegistrationChange[]
}

type CorrectionRequiredOrderResult = {
  readonly kind: 'correction-required'
  readonly invalidConfigurations: readonly OrderRegistrationInvalidConfiguration[]
  readonly shortages: readonly OrderRegistrationShortage[]
  readonly changes: readonly OrderRegistrationChange[]
}

export type OrderRegistrationResult =
  | RegisteredOrderResult
  | RepricedOrderResult
  | ReviewRequiredOrderResult
  | CorrectionRequiredOrderResult
