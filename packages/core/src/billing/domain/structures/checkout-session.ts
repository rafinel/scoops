export type CheckoutSession = {
  readonly providerCheckoutId: string
  readonly url: string
  readonly expiresAt?: Date
}
