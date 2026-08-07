import type { BillingAcceptancesRepository } from '#billing/interfaces/billing-acceptances-repository.ts'
import type { BillingProviderEventsRepository } from '#billing/interfaces/billing-provider-events-repository.ts'
import type { BillingProfilesRepository } from '#billing/interfaces/billing-profiles-repository.ts'
import type { ChargesRepository } from '#billing/interfaces/charges-repository.ts'
import type { FiscalDocumentsRepository } from '#billing/interfaces/fiscal-documents-repository.ts'
import type { SubscriptionsRepository } from '#billing/interfaces/subscriptions-repository.ts'
import type { TrialEligibilitiesRepository } from '#billing/interfaces/trial-eligibilities-repository.ts'

export type BillingDatabaseScope = {
  billingProfilesRepository: BillingProfilesRepository
  subscriptionsRepository: SubscriptionsRepository
  chargesRepository: ChargesRepository
  fiscalDocumentsRepository: FiscalDocumentsRepository
  billingAcceptancesRepository: BillingAcceptancesRepository
  trialEligibilitiesRepository: TrialEligibilitiesRepository
  billingProviderEventsRepository: BillingProviderEventsRepository
}

export interface BillingDatabase {
  run<Result>(
    operation: (scope: BillingDatabaseScope) => Promise<Result>,
  ): Promise<Result>
}
