import type {
  Subscription,
  SubscriptionCreate,
  SubscriptionUpdate,
} from '#billing/domain/entities/subscription.ts'

export interface SubscriptionsRepository {
  add(input: SubscriptionCreate): Promise<Subscription>
  findById(subscriptionId: string): Promise<Subscription | undefined>
  findByEstablishmentId(establishmentId: string): Promise<Subscription | undefined>
  findByProviderSubscriptionId(
    providerSubscriptionId: string,
  ): Promise<Subscription | undefined>
  replace(establishmentId: string, changes: SubscriptionUpdate): Promise<Subscription>
}
