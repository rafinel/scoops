import type { BillingAddress } from '#billing/domain/structures/billing-address.ts'
import type { BillingHolderType } from '#billing/domain/structures/billing-holder-type.ts'

export type BillingProviderCustomer = {
  readonly holderType: BillingHolderType
  readonly name: string
  readonly taxId: string
  readonly email: string
  readonly phone: string
  readonly address: BillingAddress
}
