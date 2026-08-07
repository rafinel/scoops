import type {
  BillingProfile,
  BillingProfileCreate,
  BillingProfileUpdate,
} from '#billing/domain/entities/billing-profile.ts'

export interface BillingProfilesRepository {
  add(input: BillingProfileCreate): Promise<BillingProfile>
  findByEstablishmentId(establishmentId: string): Promise<BillingProfile | undefined>
  replace(establishmentId: string, changes: BillingProfileUpdate): Promise<BillingProfile>
}
