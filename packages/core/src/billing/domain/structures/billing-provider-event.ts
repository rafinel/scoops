export type BillingProviderEvent = {
  readonly eventId: string
  readonly type: string
  readonly providerCustomerId?: string
  readonly providerSubscriptionId?: string
  readonly providerChargeId?: string
  readonly occurredAt: Date
  readonly payload: unknown
}
