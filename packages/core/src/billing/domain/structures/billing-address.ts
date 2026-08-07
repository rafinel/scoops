export type BillingAddress = {
  readonly street: string
  readonly number: string
  readonly complement?: string
  readonly neighborhood: string
  readonly city: string
  readonly state: string
  readonly postalCode: string
  readonly country: 'BR'
}
