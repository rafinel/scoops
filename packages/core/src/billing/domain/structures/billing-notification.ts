export type BillingNotification = {
  readonly establishmentId: string
  readonly event: string
  readonly subject: string
  readonly recipient: string
  readonly payload: Readonly<Record<string, unknown>>
}
