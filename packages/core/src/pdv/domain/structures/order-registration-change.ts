type OrderRegistrationValue = {
  readonly label: string
  readonly amount: number
}

export type OrderRegistrationChange = {
  readonly kind: 'channel' | 'combo' | 'catalog'
  readonly cause?: 'accompaniment-price'
  readonly previous: OrderRegistrationValue
  readonly current: OrderRegistrationValue
}
