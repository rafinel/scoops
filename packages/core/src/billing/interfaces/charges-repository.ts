import type {
  Charge,
  ChargeCreate,
  ChargeUpdate,
} from '#billing/domain/entities/charge.ts'

export interface ChargesRepository {
  add(input: ChargeCreate): Promise<Charge>
  findById(chargeId: string): Promise<Charge | undefined>
  findByProviderChargeId(providerChargeId: string): Promise<Charge | undefined>
  findBySubscriptionId(subscriptionId: string): Promise<readonly Charge[]>
  replace(chargeId: string, changes: ChargeUpdate): Promise<Charge>
}
