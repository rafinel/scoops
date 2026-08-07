import type { BillingProfile } from '#billing/domain/entities/billing-profile.ts'
import type { Charge } from '#billing/domain/entities/charge.ts'

export type FiscalDocumentInput = {
  readonly profile: BillingProfile
  readonly charge: Charge
}
