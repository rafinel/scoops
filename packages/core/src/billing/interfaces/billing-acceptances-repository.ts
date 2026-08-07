import type {
  BillingAcceptance,
  BillingAcceptanceCreate,
} from '#billing/domain/entities/billing-acceptance.ts'

export interface BillingAcceptancesRepository {
  add(input: BillingAcceptanceCreate): Promise<BillingAcceptance>
  findLatestByEstablishmentId(
    establishmentId: string,
  ): Promise<BillingAcceptance | undefined>
}
