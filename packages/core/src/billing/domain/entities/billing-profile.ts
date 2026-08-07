import type { Entity } from '#shared/domain/entities/entity.ts'
import type { BillingAddress } from '#billing/domain/structures/billing-address.ts'
import type { BillingHolderType } from '#billing/domain/structures/billing-holder-type.ts'

export type BillingProfile = Entity & {
  establishmentId: string
  holderType: BillingHolderType
  holderName: string
  taxId: string
  billingEmail: string
  phone: string
  address: BillingAddress
  createdAt: Date
  updatedAt: Date
}

export type BillingProfileCreate = Omit<BillingProfile, 'id' | 'createdAt' | 'updatedAt'>

export type BillingProfileUpdate = Partial<
  Pick<
    BillingProfile,
    'holderType' | 'holderName' | 'taxId' | 'billingEmail' | 'phone' | 'address'
  >
>
