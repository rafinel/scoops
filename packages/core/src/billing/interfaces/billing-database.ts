import type { BillingAcceptancesRepository } from '#billing/interfaces/billing-acceptances-repository.ts'
import type { BillingProviderEventsRepository } from '#billing/interfaces/billing-provider-events-repository.ts'
import type { BillingProfilesRepository } from '#billing/interfaces/billing-profiles-repository.ts'
import type { ChargesRepository } from '#billing/interfaces/charges-repository.ts'
import type { FiscalDocumentsRepository } from '#billing/interfaces/fiscal-documents-repository.ts'
import type { SubscriptionsRepository } from '#billing/interfaces/subscriptions-repository.ts'
import type { TrialEligibilitiesRepository } from '#billing/interfaces/trial-eligibilities-repository.ts'
import type { EventsRepository } from '#shared/interfaces/events-repository.ts'

export type BillingDatabaseRepositories = {
  billingProfilesRepository: BillingProfilesRepository
  subscriptionsRepository: SubscriptionsRepository
  chargesRepository: ChargesRepository
  fiscalDocumentsRepository: FiscalDocumentsRepository
  billingAcceptancesRepository: BillingAcceptancesRepository
  trialEligibilitiesRepository: TrialEligibilitiesRepository
  billingProviderEventsRepository: BillingProviderEventsRepository
  eventsRepository: Pick<EventsRepository, 'add'>
}

export interface BillingDatabase {
  run<Result>(
    operation: (scope: BillingDatabaseRepositories) => Promise<Result>,
  ): Promise<Result>
}
